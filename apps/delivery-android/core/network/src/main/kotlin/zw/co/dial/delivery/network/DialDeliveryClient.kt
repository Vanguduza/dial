package zw.co.dial.delivery.network

/**
 * PD7 courier gateway client — @dial/delivery SoR via HTTP.
 * Never send userId/role in body (D-47). COD = USD minor only.
 */
data class DeliveryOfferDto(
    val id: String,
    val jobId: String,
    val status: String,
    val expiresAt: String,
)

data class DeliveryJobDto(
    val id: String,
    val orderId: String,
    val status: String,
    val offerId: String?,
    val codAmountUsdMinor: Long?,
)

data class CourierSnapshot(
    val courierId: String,
    val availability: String,
    val offers: List<DeliveryOfferDto>,
    val jobs: List<DeliveryJobDto>,
)

data class CodResult(
    val reconciled: Boolean,
    val amountUsdMinor: Long?,
    val floatLimitWarning: Boolean = false,
    val floatMessage: String? = null,
)

data class CodFloatEvalDto(
    val floatLimitWarning: Boolean,
    val message: String,
    val projectedHeldUsdMinor: Long,
    val floatLimitUsdMinor: Long,
)

data class CodCollectAttemptDto(
    val status: String,
    val floatLimitWarning: Boolean,
    val acknowledgedWarning: Boolean,
)

data class OfflinePackDto(
    val packId: String,
    val label: String,
    val city: String,
    val mapSor: String,
)

data class OfflinePackInstallDto(
    val packId: String,
    val status: String,
    val mapSor: String,
)

data class EtaBannerDto(
    val etaMinutes: Int,
    val distanceMeters: Int,
    val provider: String,
    val nextStopLabel: String,
    val remainingStopCount: Int,
    val mapSor: String,
)

data class NavigateStopDto(
    val id: String,
    val sequence: Int,
    val kind: String,
    val label: String,
    val status: String,
)

data class ReoptimiseResultDto(
    val provider: String,
    val orderChanged: Boolean,
    val etaMinutes: Int,
    val stopLabels: List<String>,
    val mapSor: String,
)

class DialDeliveryException(message: String, val statusCode: Int = 0) : Exception(message)

interface CookieStore {
    fun getCookieHeader(): String?
    fun storeFromSetCookie(headers: List<String>)
}

class MemoryCookieStore : CookieStore {
    private var cookie: String? = null

    override fun getCookieHeader(): String? = cookie

    override fun storeFromSetCookie(headers: List<String>) {
        for (raw in headers) {
            val part = raw.substringBefore(';').trim()
            if (part.startsWith("dial_session=")) {
                cookie = part
                return
            }
        }
    }

    fun clear() {
        cookie = null
    }
}

data class HttpResponse(
    val statusCode: Int,
    val body: String,
    val setCookieHeaders: List<String>,
)

fun interface HttpTransport {
    fun request(
        method: String,
        url: String,
        headers: Map<String, String>,
        body: String?,
        cookieHeader: String?,
    ): HttpResponse
}

class UrlConnectionTransport : HttpTransport {
    override fun request(
        method: String,
        url: String,
        headers: Map<String, String>,
        body: String?,
        cookieHeader: String?,
    ): HttpResponse {
        val conn = java.net.URI(url).toURL().openConnection() as java.net.HttpURLConnection
        conn.requestMethod = method
        conn.connectTimeout = 15_000
        conn.readTimeout = 15_000
        conn.doInput = true
        headers.forEach { (k, v) -> conn.setRequestProperty(k, v) }
        if (!cookieHeader.isNullOrBlank()) {
            conn.setRequestProperty("Cookie", cookieHeader)
        }
        if (body != null) {
            conn.doOutput = true
            conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        }
        val code = conn.responseCode
        val stream = if (code in 200..299) conn.inputStream else conn.errorStream
        val text = stream?.bufferedReader()?.readText().orEmpty()
        val setCookies = conn.headerFields["Set-Cookie"].orEmpty()
        conn.disconnect()
        return HttpResponse(code, text, setCookies)
    }
}

class DialDeliveryClient(
    private val baseUrl: String,
    private val cookies: CookieStore = MemoryCookieStore(),
    private val transport: HttpTransport = UrlConnectionTransport(),
) {
    fun signIn(email: String, password: String) {
        val body =
            """{"email":${jsonString(email)},"password":${jsonString(password)}}"""
        val res =
            transport.request(
                "POST",
                "$baseUrl/api/auth/sign-in",
                mapOf("Content-Type" to "application/json", "Accept" to "application/json"),
                body,
                cookies.getCookieHeader(),
            )
        cookies.storeFromSetCookie(res.setCookieHeaders)
        if (res.statusCode !in 200..299) {
            throw DialDeliveryException(parseError(res.body) ?: "sign-in failed", res.statusCode)
        }
    }

    fun snapshot(): CourierSnapshot {
        val res = get("/api/delivery/courier")
        return parseSnapshot(res.body)
    }

    fun setAvailability(status: String) {
        require(status in setOf("available", "busy", "offline"))
        postAction("""{"action":"set_availability","status":${jsonString(status)}}""")
    }

    fun seedOffer(codUsdMinor: Long = 2500): Pair<String, String> {
        val body =
            postAction("""{"action":"seed_offer","codUsdMinor":${jsonString(codUsdMinor.toString())}}""")
        val offerId =
            Regex(""""id"\s*:\s*"([^"]+)"""").find(
                Regex(""""offer"\s*:\s*\{[^}]*\}""").find(body)?.value.orEmpty(),
            )?.groupValues?.get(1)
                ?: throw DialDeliveryException("seed missing offer id")
        val jobId =
            Regex(""""id"\s*:\s*"([^"]+)"""").find(
                Regex(""""job"\s*:\s*\{[^}]*\}""").find(body)?.value.orEmpty(),
            )?.groupValues?.get(1)
                ?: throw DialDeliveryException("seed missing job id")
        return offerId to jobId
    }

    fun acceptOffer(offerId: String) {
        postAction("""{"action":"accept_offer","offerId":${jsonString(offerId)}}""")
    }

    fun rejectOffer(offerId: String) {
        postAction("""{"action":"reject_offer","offerId":${jsonString(offerId)}}""")
    }

    fun startTransit(jobId: String) {
        postAction("""{"action":"start_transit","jobId":${jsonString(jobId)}}""")
    }

    fun postLocation(lat: Double, lng: Double, jobId: String?) {
        val jobPart = if (jobId != null) ""","jobId":${jsonString(jobId)}""" else ""
        postAction("""{"action":"post_location","lat":$lat,"lng":$lng$jobPart}""")
    }

    fun capturePod(jobId: String, photoRef: String? = null) {
        val photoPart =
            if (photoRef != null) ""","photoRef":${jsonString(photoRef)}""" else ""
        postAction("""{"action":"capture_pod","jobId":${jsonString(jobId)}$photoPart}""")
    }

    fun reconcileCod(jobId: String): CodResult {
        val body = postAction("""{"action":"reconcile_cod","jobId":${jsonString(jobId)}}""")
        val reconciled = body.contains("\"reconciled\":true") || body.contains("\"reconciled\": true")
        val amount =
            Regex(""""amountUsdMinor"\s*:\s*"?(\d+)"?""")
                .find(body)
                ?.groupValues
                ?.get(1)
                ?.toLongOrNull()
        val warn =
            body.contains("\"floatLimitWarning\":true") ||
                body.contains("\"floatLimitWarning\": true")
        val msg =
            Regex(""""message"\s*:\s*"([^"]*)"""").find(body)?.groupValues?.get(1)
        return CodResult(reconciled, amount, warn, msg)
    }

    fun setCodFloatLimit(floatLimitUsdMinor: Long) {
        postAction(
            """{"action":"set_cod_float_limit","floatLimitUsdMinor":${jsonString(floatLimitUsdMinor.toString())}}""",
        )
    }

    fun evaluateCodFloat(collectUsdMinor: Long): CodFloatEvalDto {
        val body =
            postAction(
                """{"action":"evaluate_cod_float","collectUsdMinor":${jsonString(collectUsdMinor.toString())}}""",
            )
        return parseCodFloatEval(body)
            ?: throw DialDeliveryException("evaluate_cod_float missing")
    }

    fun codCollectAttempt(
        jobId: String,
        collectUsdMinor: Long,
        acknowledgedWarning: Boolean,
    ): CodCollectAttemptDto {
        val body =
            postAction(
                """{"action":"cod_collect_attempt","jobId":${jsonString(jobId)},"collectUsdMinor":${jsonString(collectUsdMinor.toString())},"acknowledgedWarning":$acknowledgedWarning}""",
            )
        return parseCodAttempt(body)
            ?: throw DialDeliveryException("cod_collect_attempt missing")
    }

    /** PD28 — list MapLibre offline tile packs (Harare/Bulawayo). */
    fun listOfflinePacks(): List<OfflinePackDto> {
        val body = postAction("""{"action":"list_offline_packs"}""")
        return parseOfflinePacks(body)
    }

    fun activateOfflinePack(packId: String): OfflinePackInstallDto {
        require(packId == "harare_metro" || packId == "bulawayo_metro")
        val body =
            postAction(
                """{"action":"activate_offline_pack","packId":${jsonString(packId)}}""",
            )
        return parseOfflineInstall(body)
            ?: throw DialDeliveryException("activate_offline_pack missing install")
    }

    /** PD29 — OSRM ETA banner (D-44). */
    fun getEtaBanner(jobId: String): EtaBannerDto {
        val body =
            postAction("""{"action":"get_eta_banner","jobId":${jsonString(jobId)}}""")
        return parseEtaBanner(body)
            ?: throw DialDeliveryException("get_eta_banner missing banner")
    }

    fun listNavigateStops(jobId: String): List<NavigateStopDto> {
        val body =
            postAction("""{"action":"list_navigate_stops","jobId":${jsonString(jobId)}}""")
        return parseNavigateStops(body)
    }

    fun reoptimiseStops(jobId: String): ReoptimiseResultDto {
        val body =
            postAction("""{"action":"reoptimise_stops","jobId":${jsonString(jobId)}}""")
        return parseReoptimise(body)
            ?: throw DialDeliveryException("reoptimise_stops missing result")
    }

    private fun get(path: String): HttpResponse {
        val res =
            transport.request(
                "GET",
                "$baseUrl$path",
                mapOf("Accept" to "application/json"),
                null,
                cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialDeliveryException(parseError(res.body) ?: "GET failed", res.statusCode)
        }
        return res
    }

    private fun postAction(jsonBody: String): String {
        require(!jsonBody.contains("userId") && !jsonBody.contains("\"role\"")) {
            "identity fields forbidden in body (D-47)"
        }
        val res =
            transport.request(
                "POST",
                "$baseUrl/api/delivery/courier",
                mapOf("Content-Type" to "application/json", "Accept" to "application/json"),
                jsonBody,
                cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialDeliveryException(parseError(res.body) ?: "action failed", res.statusCode)
        }
        return res.body
    }
}

internal fun jsonString(value: String): String =
    buildString {
        append('"')
        for (c in value) {
            when (c) {
                '\\' -> append("\\\\")
                '"' -> append("\\\"")
                else -> append(c)
            }
        }
        append('"')
    }

internal fun parseError(body: String): String? =
    Regex(""""error"\s*:\s*"([^"]+)"""").find(body)?.groupValues?.get(1)

internal fun parseSnapshot(body: String): CourierSnapshot {
    val courierId =
        Regex(""""courierId"\s*:\s*"([^"]+)"""").find(body)?.groupValues?.get(1).orEmpty()
    val availability =
        Regex(""""availability"\s*:\s*"([^"]+)"""").find(body)?.groupValues?.get(1) ?: "offline"
    val offers = mutableListOf<DeliveryOfferDto>()
    val offerBlocks =
        Regex(""""offers"\s*:\s*\[(.*?)]""", RegexOption.DOT_MATCHES_ALL)
            .find(body)
            ?.groupValues
            ?.get(1)
            .orEmpty()
    Regex("""\{[^{}]*"id"\s*:\s*"([^"]+)"[^{}]*\}""").findAll(offerBlocks).forEach { m ->
        val chunk = m.value
        fun f(n: String) =
            Regex(""""$n"\s*:\s*"([^"]*)"""").find(chunk)?.groupValues?.get(1).orEmpty()
        offers.add(
            DeliveryOfferDto(
                id = f("id"),
                jobId = f("jobId"),
                status = f("status"),
                expiresAt = f("expiresAt"),
            ),
        )
    }
    return CourierSnapshot(courierId, availability, offers, emptyList())
}

internal fun parseOfflinePacks(body: String): List<OfflinePackDto> {
    val block =
        Regex(""""packs"\s*:\s*\[(.*?)]""", RegexOption.DOT_MATCHES_ALL)
            .find(body)
            ?.groupValues
            ?.get(1)
            .orEmpty()
    return Regex("""\{[^{}]*"packId"\s*:\s*"([^"]+)"[^{}]*\}""")
        .findAll(block)
        .map { m ->
            val chunk = m.value
            fun f(n: String) =
                Regex(""""$n"\s*:\s*"([^"]*)"""").find(chunk)?.groupValues?.get(1).orEmpty()
            OfflinePackDto(
                packId = f("packId"),
                label = f("label"),
                city = f("city"),
                mapSor = f("mapSor").ifEmpty { "maplibre" },
            )
        }
        .toList()
}

internal fun parseOfflineInstall(body: String): OfflinePackInstallDto? {
    val chunk =
        Regex(""""installed"\s*:\s*(\{[^{}]*\})""")
            .find(body)
            ?.groupValues
            ?.get(1) ?: return null
    fun f(n: String) =
        Regex(""""$n"\s*:\s*"([^"]*)"""").find(chunk)?.groupValues?.get(1).orEmpty()
    return OfflinePackInstallDto(
        packId = f("packId"),
        status = f("status"),
        mapSor = f("mapSor").ifEmpty { "maplibre" },
    )
}

internal fun parseEtaBanner(body: String): EtaBannerDto? {
    val chunk =
        Regex(""""etaBanner"\s*:\s*(\{[^{}]*\})""")
            .find(body)
            ?.groupValues
            ?.get(1) ?: return null
    fun s(n: String) =
        Regex(""""$n"\s*:\s*"([^"]*)"""").find(chunk)?.groupValues?.get(1).orEmpty()
    fun i(n: String) =
        Regex(""""$n"\s*:\s*(\d+)""").find(chunk)?.groupValues?.get(1)?.toIntOrNull() ?: 0
    return EtaBannerDto(
        etaMinutes = i("etaMinutes"),
        distanceMeters = i("distanceMeters"),
        provider = s("provider"),
        nextStopLabel = s("nextStopLabel"),
        remainingStopCount = i("remainingStopCount"),
        mapSor = s("mapSor").ifEmpty { "maplibre" },
    )
}

internal fun parseNavigateStops(body: String): List<NavigateStopDto> {
    val block =
        Regex(""""stops"\s*:\s*\[(.*?)]""", RegexOption.DOT_MATCHES_ALL)
            .find(body)
            ?.groupValues
            ?.get(1)
            .orEmpty()
    return Regex("""\{[^{}]*"id"\s*:\s*"([^"]+)"[^{}]*\}""")
        .findAll(block)
        .map { m ->
            val chunk = m.value
            fun s(n: String) =
                Regex(""""$n"\s*:\s*"([^"]*)"""").find(chunk)?.groupValues?.get(1).orEmpty()
            fun i(n: String) =
                Regex(""""$n"\s*:\s*(\d+)""").find(chunk)?.groupValues?.get(1)?.toIntOrNull() ?: 0
            NavigateStopDto(
                id = s("id"),
                sequence = i("sequence"),
                kind = s("kind"),
                label = s("label"),
                status = s("status"),
            )
        }
        .toList()
}

internal fun parseReoptimise(body: String): ReoptimiseResultDto? {
    val provider =
        Regex(""""provider"\s*:\s*"([^"]+)"""").find(body)?.groupValues?.get(1) ?: return null
    val orderChanged =
        body.contains("\"orderChanged\":true") || body.contains("\"orderChanged\": true")
    val banner = parseEtaBanner(body)
    val stops = parseNavigateStops(body)
    return ReoptimiseResultDto(
        provider = provider,
        orderChanged = orderChanged,
        etaMinutes = banner?.etaMinutes ?: 0,
        stopLabels = stops.sortedBy { it.sequence }.map { it.label },
        mapSor =
            Regex(""""mapSor"\s*:\s*"([^"]+)"""").find(body)?.groupValues?.get(1)
                ?: "maplibre",
    )
}

internal fun parseCodFloatEval(body: String): CodFloatEvalDto? {
    val chunk =
        Regex(""""evaluation"\s*:\s*(\{[^{}]*\})""")
            .find(body)
            ?.groupValues
            ?.get(1) ?: return null
    fun s(n: String) =
        Regex(""""$n"\s*:\s*"([^"]*)"""").find(chunk)?.groupValues?.get(1).orEmpty()
    fun b(n: String) =
        Regex(""""$n"\s*:\s*(true|false)""")
            .find(chunk)
            ?.groupValues
            ?.get(1) == "true"
    fun l(n: String) =
        Regex(""""$n"\s*:\s*"?(\d+)"?""")
            .find(chunk)
            ?.groupValues
            ?.get(1)
            ?.toLongOrNull() ?: 0L
    return CodFloatEvalDto(
        floatLimitWarning = b("floatLimitWarning"),
        message = s("message"),
        projectedHeldUsdMinor = l("projectedHeldUsdMinor"),
        floatLimitUsdMinor = l("floatLimitUsdMinor"),
    )
}

internal fun parseCodAttempt(body: String): CodCollectAttemptDto? {
    val chunk =
        Regex(""""attempt"\s*:\s*(\{[^{}]*\})""")
            .find(body)
            ?.groupValues
            ?.get(1) ?: return null
    fun s(n: String) =
        Regex(""""$n"\s*:\s*"([^"]*)"""").find(chunk)?.groupValues?.get(1).orEmpty()
    fun b(n: String) =
        Regex(""""$n"\s*:\s*(true|false)""")
            .find(chunk)
            ?.groupValues
            ?.get(1) == "true"
    return CodCollectAttemptDto(
        status = s("status"),
        floatLimitWarning = b("floatLimitWarning"),
        acknowledgedWarning = b("acknowledgedWarning"),
    )
}
