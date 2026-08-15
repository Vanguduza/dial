package zw.co.dial.technician.network

/**
 * PD9 technician gateway client — @dial/jobs SoR via /api/tech/technician.
 * Session = dial_session cookie; never send userId/role in body (D-47).
 */
data class TechJobDto(
    val id: String,
    val status: String,
    val jobClassId: String,
    val draftAmountUsdMinor: Long?,
)

data class ChecklistRunDto(
    val runId: String,
    val checklistId: String,
    val stepIndex: Int,
    val status: String,
)

data class TakeHomePreview(
    val netPayoutMinor: Long,
    val withholdMinor: Long,
    val rateBps: Int,
)

data class ValueScoreFactorDto(
    val factor: String,
    val weight: Double,
    val contribution: Double,
)

data class ValueScoreDto(
    val technicianId: String,
    val score: Int,
    val confidence: String,
    val factorContributions: List<ValueScoreFactorDto>,
)

data class Itf263Dto(
    val recordId: String,
    val status: String,
    val documentRef: String?,
    val certificatePdfRef: String?,
)

data class TakeHomeBreakdownDto(
    val grossUsdMinor: Long,
    val dialFeeUsdMinor: Long,
    val taxableShareUsdMinor: Long,
    val withholdMinor: Long,
    val netPayoutMinor: Long,
    val rateBps: Int,
    val hasItf263: Boolean,
    val itf263Status: String,
    val certificatePdfRef: String?,
    val payableFromAi: Boolean,
)

data class CheckInDto(
    val accepted: Boolean,
    val reason: String,
    val isMockLocation: Boolean,
    val punctualityEligible: Boolean,
    val distanceMeters: Int,
)

data class CameraEvidenceDto(
    val evidenceId: String,
    val overlayChecklistStep: String,
    val cameraSource: String,
    val flushStatus: String,
    val payableFromAi: Boolean,
)

class DialTechnicianException(message: String, val statusCode: Int = 0) : Exception(message)

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

class DialTechnicianClient(
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
            throw DialTechnicianException(parseError(res.body) ?: "sign-in failed", res.statusCode)
        }
    }

    fun listJobs(): List<TechJobDto> {
        val res = get("/api/tech/technician")
        return parseJobs(res.body)
    }

    fun seedAssignedJob(): TechJobDto {
        val body = postAction("""{"action":"seed_assigned_job"}""")
        return parseJobObject(body) ?: throw DialTechnicianException("seed missing job")
    }

    fun startChecklist(jobId: String, checklistId: String = "automotive_basic"): ChecklistRunDto {
        val body =
            postAction(
                """{"action":"start_checklist","jobId":${jsonString(jobId)},"checklistId":${jsonString(checklistId)}}""",
            )
        return parseRun(body) ?: throw DialTechnicianException("start_checklist missing run")
    }

    fun advanceChecklist(runId: String): ChecklistRunDto {
        val body = postAction("""{"action":"advance_checklist","runId":${jsonString(runId)}}""")
        return parseRun(body) ?: throw DialTechnicianException("advance missing run")
    }

    fun uploadEvidence(jobId: String, kind: String, payloadRef: String) {
        require(kind == "photo" || kind == "note")
        postAction(
            """{"action":"upload_evidence","jobId":${jsonString(jobId)},"kind":${jsonString(kind)},"payloadRef":${jsonString(payloadRef)}}""",
        )
    }

    fun takeHomePreview(payoutUsdMinor: Long, hasItf263: Boolean): TakeHomePreview {
        val body =
            postAction(
                """{"action":"take_home_preview","payoutUsdMinor":${jsonString(payoutUsdMinor.toString())},"hasItf263":$hasItf263}""",
            )
        val net =
            Regex(""""netPayoutMinor"\s*:\s*"?(\d+)"?""")
                .find(body)
                ?.groupValues
                ?.get(1)
                ?.toLongOrNull() ?: 0L
        val withhold =
            Regex(""""withholdMinor"\s*:\s*"?(\d+)"?""")
                .find(body)
                ?.groupValues
                ?.get(1)
                ?.toLongOrNull() ?: 0L
        val rate =
            Regex(""""rateBps"\s*:\s*(\d+)""")
                .find(body)
                ?.groupValues
                ?.get(1)
                ?.toIntOrNull() ?: 0
        return TakeHomePreview(net, withhold, rate)
    }

    /** PD25 — Value Score with factor explainability (never payable). */
    fun fetchValueScore(): ValueScoreDto {
        val res = get("/api/tech/technician?view=value_score")
        return parseValueScore(res.body) ?: throw DialTechnicianException("value_score missing")
    }

    /** PD25 — ITF263 status (D-50). */
    fun fetchItf263(): Itf263Dto? {
        val res = get("/api/tech/technician?view=itf263")
        return parseItf263(res.body)
    }

    fun uploadItf263(documentRef: String): Itf263Dto {
        val body =
            postAction(
                """{"action":"upload_itf263","documentRef":${jsonString(documentRef)}}""",
            )
        return parseItf263(body) ?: throw DialTechnicianException("upload_itf263 missing record")
    }

    fun verifyItf263Fixture(): Itf263Dto {
        val body = postAction("""{"action":"verify_itf263_fixture"}""")
        return parseItf263(body) ?: throw DialTechnicianException("verify_itf263 missing record")
    }

    /** PD25 — Your DIAL Take-Home gross → fee → WHT → net. */
    fun takeHomeBreakdown(grossUsdMinor: Long, dialFeeUsdMinor: Long): TakeHomeBreakdownDto {
        val body =
            postAction(
                """{"action":"take_home_breakdown","grossUsdMinor":${jsonString(grossUsdMinor.toString())},"dialFeeUsdMinor":${jsonString(dialFeeUsdMinor.toString())}}""",
            )
        return parseTakeHomeBreakdown(body)
            ?: throw DialTechnicianException("take_home_breakdown missing")
    }

    /** PD30 — mock-location aware check-in (2B-29). */
    fun checkIn(
        jobId: String,
        lat: Double,
        lng: Double,
        isMockLocation: Boolean,
        accuracyMeters: Int = 15,
    ): CheckInDto {
        val body =
            postAction(
                """{"action":"check_in","jobId":${jsonString(jobId)},"lat":$lat,"lng":$lng,"isMockLocation":$isMockLocation,"accuracyMeters":$accuracyMeters}""",
            )
        return parseCheckIn(body) ?: throw DialTechnicianException("check_in missing")
    }

    /** PD30 — device camera evidence with checklist overlay + optional offline queue. */
    fun captureCameraEvidence(
        jobId: String,
        payloadRef: String,
        overlayChecklistStep: String,
        queuedOffline: Boolean = true,
    ): CameraEvidenceDto {
        val body =
            postAction(
                """{"action":"capture_camera_evidence","jobId":${jsonString(jobId)},"payloadRef":${jsonString(payloadRef)},"overlayChecklistStep":${jsonString(overlayChecklistStep)},"queuedOffline":$queuedOffline}""",
            )
        return parseCameraEvidence(body)
            ?: throw DialTechnicianException("capture_camera_evidence missing")
    }

    fun flushEvidenceQueue(): Int {
        val body = postAction("""{"action":"flush_evidence_queue"}""")
        return Regex(""""flushed"\s*:\s*(\d+)""")
            .find(body)
            ?.groupValues
            ?.get(1)
            ?.toIntOrNull() ?: 0
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
            throw DialTechnicianException(parseError(res.body) ?: "GET failed", res.statusCode)
        }
        return res
    }

    private fun postAction(jsonBody: String): String {
        // D-47: never send userId/role in body.
        require(!jsonBody.contains("userId") && !jsonBody.contains("\"role\"")) {
            "identity fields forbidden in body (D-47)"
        }
        val res =
            transport.request(
                "POST",
                "$baseUrl/api/tech/technician",
                mapOf("Content-Type" to "application/json", "Accept" to "application/json"),
                jsonBody,
                cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialTechnicianException(parseError(res.body) ?: "action failed", res.statusCode)
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

internal fun parseJobs(body: String): List<TechJobDto> {
    val block =
        Regex(""""jobs"\s*:\s*\[(.*?)]""", RegexOption.DOT_MATCHES_ALL)
            .find(body)
            ?.groupValues
            ?.get(1)
            .orEmpty()
    return Regex("""\{[^{}]*"id"\s*:\s*"([^"]+)"[^{}]*\}""")
        .findAll(block)
        .map { parseJobChunk(it.value) }
        .toList()
}

internal fun parseJobObject(body: String): TechJobDto? {
    val chunk =
        Regex(""""job"\s*:\s*(\{[^{}]*\})""")
            .find(body)
            ?.groupValues
            ?.get(1) ?: return null
    return parseJobChunk(chunk)
}

internal fun parseJobChunk(chunk: String): TechJobDto {
    fun f(n: String) = Regex(""""$n"\s*:\s*"([^"]*)"""").find(chunk)?.groupValues?.get(1).orEmpty()
    val amount =
        Regex(""""draftAmountUsdMinor"\s*:\s*"?(\d+)"?""")
            .find(chunk)
            ?.groupValues
            ?.get(1)
            ?.toLongOrNull()
    return TechJobDto(
        id = f("id"),
        status = f("status"),
        jobClassId = f("jobClassId"),
        draftAmountUsdMinor = amount,
    )
}

internal fun parseRun(body: String): ChecklistRunDto? {
    val chunk =
        Regex(""""run"\s*:\s*(\{[^{}]*\})""")
            .find(body)
            ?.groupValues
            ?.get(1) ?: return null
    fun f(n: String) = Regex(""""$n"\s*:\s*"([^"]*)"""").find(chunk)?.groupValues?.get(1).orEmpty()
    val step =
        Regex(""""stepIndex"\s*:\s*(\d+)""")
            .find(chunk)
            ?.groupValues
            ?.get(1)
            ?.toIntOrNull() ?: 0
    return ChecklistRunDto(
        runId = f("runId"),
        checklistId = f("checklistId"),
        stepIndex = step,
        status = f("status"),
    )
}

internal fun parseValueScore(body: String): ValueScoreDto? {
    val chunk =
        Regex(""""valueScore"\s*:\s*(\{.*?\})\s*[,}]""", RegexOption.DOT_MATCHES_ALL)
            .find(body)
            ?.groupValues
            ?.get(1) ?: return null
    fun f(n: String) = Regex(""""$n"\s*:\s*"([^"]*)"""").find(chunk)?.groupValues?.get(1).orEmpty()
    val score =
        Regex(""""score"\s*:\s*(\d+)""")
            .find(chunk)
            ?.groupValues
            ?.get(1)
            ?.toIntOrNull() ?: 0
    val factors =
        Regex(
            """\{[^{}]*"factor"\s*:\s*"([^"]+)"[^{}]*"weight"\s*:\s*([0-9.]+)[^{}]*"contribution"\s*:\s*([0-9.]+)[^{}]*\}""",
        ).findAll(chunk)
            .map {
                ValueScoreFactorDto(
                    factor = it.groupValues[1],
                    weight = it.groupValues[2].toDoubleOrNull() ?: 0.0,
                    contribution = it.groupValues[3].toDoubleOrNull() ?: 0.0,
                )
            }
            .toList()
            .ifEmpty {
                Regex(
                    """\{[^{}]*"factor"\s*:\s*"([^"]+)"[^{}]*\}""",
                ).findAll(chunk)
                    .map {
                        ValueScoreFactorDto(it.groupValues[1], 0.0, 0.0)
                    }
                    .toList()
            }
    return ValueScoreDto(
        technicianId = f("technicianId"),
        score = score,
        confidence = f("confidence"),
        factorContributions = factors,
    )
}

internal fun parseItf263(body: String): Itf263Dto? {
    val chunk =
        Regex(""""itf263"\s*:\s*(\{[^{}]*\})""")
            .find(body)
            ?.groupValues
            ?.get(1) ?: return null
    fun f(n: String): String? {
        val m = Regex(""""$n"\s*:\s*"([^"]*)"""").find(chunk) ?: return null
        return m.groupValues[1]
    }
    fun nullable(n: String): String? {
        if (Regex(""""$n"\s*:\s*null""").containsMatchIn(chunk)) return null
        return f(n)
    }
    return Itf263Dto(
        recordId = f("recordId").orEmpty(),
        status = f("status").orEmpty(),
        documentRef = nullable("documentRef"),
        certificatePdfRef = nullable("certificatePdfRef"),
    )
}

internal fun parseTakeHomeBreakdown(body: String): TakeHomeBreakdownDto? {
    fun num(n: String): Long =
        Regex(""""$n"\s*:\s*"?(\d+)"?""")
            .find(body)
            ?.groupValues
            ?.get(1)
            ?.toLongOrNull() ?: 0L
    fun bool(n: String): Boolean =
        Regex(""""$n"\s*:\s*(true|false)""")
            .find(body)
            ?.groupValues
            ?.get(1) == "true"
    fun str(n: String): String? {
        if (Regex(""""$n"\s*:\s*null""").containsMatchIn(body)) return null
        return Regex(""""$n"\s*:\s*"([^"]*)"""").find(body)?.groupValues?.get(1)
    }
    if (!body.contains("netPayoutMinor")) return null
    return TakeHomeBreakdownDto(
        grossUsdMinor = num("grossUsdMinor"),
        dialFeeUsdMinor = num("dialFeeUsdMinor"),
        taxableShareUsdMinor = num("taxableShareUsdMinor"),
        withholdMinor = num("withholdMinor"),
        netPayoutMinor = num("netPayoutMinor"),
        rateBps = num("rateBps").toInt(),
        hasItf263 = bool("hasItf263"),
        itf263Status = str("itf263Status").orEmpty(),
        certificatePdfRef = str("certificatePdfRef"),
        payableFromAi = bool("payableFromAi"),
    )
}

internal fun parseCheckIn(body: String): CheckInDto? {
    val chunk =
        Regex(""""checkIn"\s*:\s*(\{[^{}]*\})""")
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
    fun i(n: String) =
        Regex(""""$n"\s*:\s*(\d+)""").find(chunk)?.groupValues?.get(1)?.toIntOrNull() ?: 0
    return CheckInDto(
        accepted = b("accepted"),
        reason = s("reason"),
        isMockLocation = b("isMockLocation"),
        punctualityEligible = b("punctualityEligible"),
        distanceMeters = i("distanceMeters"),
    )
}

internal fun parseCameraEvidence(body: String): CameraEvidenceDto? {
    val chunk =
        Regex(""""camera"\s*:\s*(\{[^{}]*\})""")
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
    return CameraEvidenceDto(
        evidenceId = s("evidenceId"),
        overlayChecklistStep = s("overlayChecklistStep"),
        cameraSource = s("cameraSource"),
        flushStatus = s("flushStatus"),
        payableFromAi = b("payableFromAi"),
    )
}
