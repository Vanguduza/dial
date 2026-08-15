package zw.co.dial.customer.network

/**
 * Gateway ERP client for customer-android (PD5 + PD20 deepen).
 * Session SoR = dial_session cookie from Set-Cookie — never body userId/role (D-47).
 * Browse/cart currency = USD (D-57). Orders/returns/garage parity with PD18 web.
 */
data class DialSession(
    val userId: String,
    val email: String,
    val buyerSegment: String,
)

data class SpareOfferHit(
    val offerId: String,
    val title: String,
    val unitPriceUsdMinor: Long,
    val brand: String,
    val oem: String,
    val qualityTier: String,
    val offerSource: String,
    val supplierFormality: String,
)

data class SpareSearchResult(
    val q: String,
    val currency: String,
    val sessionRole: String,
    val hits: List<SpareOfferHit>,
)

data class SpareCheckoutResult(
    val ok: Boolean,
    val currency: String,
    val cartTotalUsdMinor: Long,
    val choice: String,
    val intentId: String?,
    val fxRateId: String?,
    val soldBy: String?,
    val imttOnCheckoutLines: Boolean,
    val cartId: String? = null,
)

data class SpareOrderSummary(
    val orderId: String,
    val status: String,
    val currency: String,
    val totalUsdMinor: Long,
    val payChoice: String,
    val soldBySummary: String,
)

data class SpareTrackResult(
    val order: SpareOrderSummary,
    val statusFrom: String,
    val zigOnTrack: Boolean,
)

data class SpareReturnClaim(
    val claimId: String,
    val orderId: String,
    val status: String,
    val payableFromAi: Boolean,
)

data class GarageVehicle(
    val vehicleId: String,
    val customerId: String,
    val label: String,
    val chassisHint: String,
    val reminderConsent: Boolean,
)

data class GroceryOfferHit(
    val offerId: String,
    val title: String,
    val unitPriceUsdMinor: Long,
    val brand: String,
    val unitLabel: String,
    val coldChain: Boolean,
    val offerSource: String,
    val supplierFormality: String,
)

data class GrocerySearchResult(
    val q: String,
    val currency: String,
    val liquorSkus: Boolean,
    val hits: List<GroceryOfferHit>,
)

data class GroceryCheckoutResult(
    val ok: Boolean,
    val currency: String,
    val cartTotalUsdMinor: Long,
    val soldBy: String?,
    val imttOnCheckoutLines: Boolean,
)

class DialGatewayException(message: String, val statusCode: Int = 0) : Exception(message)

interface CookieStore {
    fun getCookieHeader(): String?
    fun storeFromSetCookie(headers: List<String>)
}

/** In-memory cookie jar — production app may wrap EncryptedSharedPreferences. */
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

    fun hasSession(): Boolean = !cookie.isNullOrBlank()
}

class DialGatewayClient(
    private val baseUrl: String,
    private val cookies: CookieStore = MemoryCookieStore(),
    private val transport: HttpTransport = UrlConnectionTransport(),
) {
    fun signIn(email: String, password: String): DialSession {
        require(email.isNotBlank()) { "email required" }
        require(password.isNotBlank()) { "password required" }
        val body =
            """{"email":${jsonString(email)},"password":${jsonString(password)}}"""
        val res =
            transport.request(
                method = "POST",
                url = "$baseUrl/api/auth/sign-in",
                headers =
                    mapOf(
                        "Content-Type" to "application/json",
                        "Accept" to "application/json",
                    ),
                body = body,
                cookieHeader = cookies.getCookieHeader(),
            )
        cookies.storeFromSetCookie(res.setCookieHeaders)
        if (res.statusCode !in 200..299) {
            throw DialGatewayException(
                parseError(res.body) ?: "sign-in failed",
                res.statusCode,
            )
        }
        return parseSession(res.body)
    }

    fun me(): DialSession {
        val res =
            transport.request(
                method = "GET",
                url = "$baseUrl/api/auth/me",
                headers = mapOf("Accept" to "application/json"),
                body = null,
                cookieHeader = cookies.getCookieHeader(),
            )
        if (res.statusCode == 401) {
            throw DialGatewayException("Unauthorized", 401)
        }
        if (res.statusCode !in 200..299) {
            throw DialGatewayException(parseError(res.body) ?: "me failed", res.statusCode)
        }
        return parseSession(res.body)
    }

    fun searchSpare(q: String = ""): SpareSearchResult {
        val encoded = java.net.URLEncoder.encode(q, Charsets.UTF_8)
        val res =
            transport.request(
                method = "GET",
                url = "$baseUrl/api/search/spare?q=$encoded",
                headers = mapOf("Accept" to "application/json"),
                body = null,
                cookieHeader = cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialGatewayException(
                parseError(res.body) ?: "search failed",
                res.statusCode,
            )
        }
        return parseSpareSearch(res.body)
    }

    fun checkoutSpare(
        offerId: String,
        choice: String,
        qty: Int = 1,
    ): SpareCheckoutResult {
        require(choice == "ecocash" || choice == "cod") {
            "choice must be ecocash|cod (D-57)"
        }
        // D-47: never send userId/role in body.
        val body =
            """{"offerId":${jsonString(offerId)},"choice":${jsonString(choice)},"qty":$qty}"""
        val res =
            transport.request(
                method = "POST",
                url = "$baseUrl/api/spare/checkout",
                headers =
                    mapOf(
                        "Content-Type" to "application/json",
                        "Accept" to "application/json",
                    ),
                body = body,
                cookieHeader = cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialGatewayException(
                parseError(res.body) ?: "checkout failed",
                res.statusCode,
            )
        }
        return parseCheckout(res.body)
    }

    /** PD20 — place ERP order after checkout (Pack §9.6 / PD18 parity). */
    fun placeSpareOrder(
        cartId: String,
        payChoice: String,
        customerId: String? = null,
    ): SpareOrderSummary {
        require(payChoice == "ecocash" || payChoice == "cod") {
            "payChoice must be ecocash|cod (D-57)"
        }
        val body =
            buildString {
                append("""{"cartId":${jsonString(cartId)},"payChoice":${jsonString(payChoice)}""")
                if (!customerId.isNullOrBlank()) {
                    append(""","customerId":${jsonString(customerId)}""")
                }
                append("}")
            }
        val res =
            transport.request(
                method = "POST",
                url = "$baseUrl/api/spare/orders",
                headers =
                    mapOf(
                        "Content-Type" to "application/json",
                        "Accept" to "application/json",
                    ),
                body = body,
                cookieHeader = cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialGatewayException(
                parseError(res.body) ?: "place order failed",
                res.statusCode,
            )
        }
        return parseOrder(res.body)
    }

    fun listSpareOrders(customerId: String? = null): List<SpareOrderSummary> {
        val qs =
            if (customerId.isNullOrBlank()) ""
            else "?customerId=${java.net.URLEncoder.encode(customerId, Charsets.UTF_8)}"
        val res =
            transport.request(
                method = "GET",
                url = "$baseUrl/api/spare/orders$qs",
                headers = mapOf("Accept" to "application/json"),
                body = null,
                cookieHeader = cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialGatewayException(
                parseError(res.body) ?: "list orders failed",
                res.statusCode,
            )
        }
        return parseOrderList(res.body)
    }

    fun trackSpareOrder(orderId: String): SpareTrackResult {
        val encoded = java.net.URLEncoder.encode(orderId, Charsets.UTF_8)
        val res =
            transport.request(
                method = "GET",
                url = "$baseUrl/api/spare/orders?orderId=$encoded",
                headers = mapOf("Accept" to "application/json"),
                body = null,
                cookieHeader = cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialGatewayException(
                parseError(res.body) ?: "track failed",
                res.statusCode,
            )
        }
        val order = parseOrder(res.body)
        val zigOnTrack =
            Regex(""""zigOnTrack"\s*:\s*true""").containsMatchIn(res.body)
        val statusFrom =
            Regex(""""statusFrom"\s*:\s*"([^"]+)"""").find(res.body)?.groupValues?.get(1) ?: "erp"
        return SpareTrackResult(order = order, statusFrom = statusFrom, zigOnTrack = zigOnTrack)
    }

    fun openSpareReturn(orderId: String): SpareReturnClaim {
        val body =
            """{"action":"open","orderId":${jsonString(orderId)},"path":"refund_or_replace"}"""
        val res =
            transport.request(
                method = "POST",
                url = "$baseUrl/api/spare/returns",
                headers =
                    mapOf(
                        "Content-Type" to "application/json",
                        "Accept" to "application/json",
                    ),
                body = body,
                cookieHeader = cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialGatewayException(
                parseError(res.body) ?: "return open failed",
                res.statusCode,
            )
        }
        return parseReturnClaim(res.body)
    }

    fun listGarageVehicles(customerId: String): List<GarageVehicle> {
        val encoded = java.net.URLEncoder.encode(customerId, Charsets.UTF_8)
        val res =
            transport.request(
                method = "GET",
                url = "$baseUrl/api/spare/garage?customerId=$encoded",
                headers = mapOf("Accept" to "application/json"),
                body = null,
                cookieHeader = cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialGatewayException(
                parseError(res.body) ?: "garage list failed",
                res.statusCode,
            )
        }
        return parseGarageList(res.body)
    }

    fun addGarageVehicle(
        customerId: String,
        label: String,
        chassisHint: String,
        reminderConsent: Boolean,
    ): GarageVehicle {
        val body =
            """{"customerId":${jsonString(customerId)},"label":${jsonString(label)},"chassisHint":${jsonString(chassisHint)},"reminderConsent":$reminderConsent}"""
        val res =
            transport.request(
                method = "POST",
                url = "$baseUrl/api/spare/garage",
                headers =
                    mapOf(
                        "Content-Type" to "application/json",
                        "Accept" to "application/json",
                    ),
                body = body,
                cookieHeader = cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialGatewayException(
                parseError(res.body) ?: "garage add failed",
                res.statusCode,
            )
        }
        return parseGarageVehicle(res.body)
    }

    fun searchGrocery(q: String = ""): GrocerySearchResult {
        val encoded = java.net.URLEncoder.encode(q, Charsets.UTF_8)
        val res =
            transport.request(
                method = "GET",
                url = "$baseUrl/api/search/grocery?q=$encoded",
                headers = mapOf("Accept" to "application/json"),
                body = null,
                cookieHeader = cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialGatewayException(
                parseError(res.body) ?: "grocery search failed",
                res.statusCode,
            )
        }
        return parseGrocerySearch(res.body)
    }

    fun checkoutGrocery(
        offerId: String,
        choice: String,
    ): GroceryCheckoutResult {
        require(choice == "ecocash" || choice == "cod") {
            "choice must be ecocash|cod (D-57)"
        }
        // D-47: never send userId/role in body.
        val body =
            """{"offerId":${jsonString(offerId)},"choice":${jsonString(choice)}}"""
        require(!body.contains("userId") && !body.contains("\"role\""))
        val res =
            transport.request(
                method = "POST",
                url = "$baseUrl/api/grocery/checkout",
                headers =
                    mapOf(
                        "Content-Type" to "application/json",
                        "Accept" to "application/json",
                    ),
                body = body,
                cookieHeader = cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialGatewayException(
                parseError(res.body) ?: "grocery checkout failed",
                res.statusCode,
            )
        }
        return parseGroceryCheckout(res.body)
    }

    fun cookieStore(): CookieStore = cookies
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

internal fun jsonString(value: String): String =
    buildString {
        append('"')
        for (c in value) {
            when (c) {
                '\\' -> append("\\\\")
                '"' -> append("\\\"")
                '\n' -> append("\\n")
                '\r' -> append("\\r")
                '\t' -> append("\\t")
                else -> append(c)
            }
        }
        append('"')
    }

internal fun parseError(body: String): String? {
    val m = Regex(""""error"\s*:\s*"([^"]+)"""").find(body)
    return m?.groupValues?.get(1)
}

internal fun parseSession(body: String): DialSession {
    fun field(name: String): String {
        val m = Regex(""""$name"\s*:\s*"([^"]+)"""").find(body)
            ?: throw DialGatewayException("Missing $name in session JSON")
        return m.groupValues[1]
    }
    return DialSession(
        userId = field("userId"),
        email = field("email"),
        buyerSegment = field("buyerSegment"),
    )
}

internal fun parseSpareSearch(body: String): SpareSearchResult {
    val currency =
        Regex(""""currency"\s*:\s*"([^"]+)"""").find(body)?.groupValues?.get(1) ?: "USD"
    val sessionRole =
        Regex(""""sessionRole"\s*:\s*"([^"]+)"""").find(body)?.groupValues?.get(1) ?: "b2c"
    val q = Regex(""""q"\s*:\s*"([^"]*)"""").find(body)?.groupValues?.get(1).orEmpty()
    val hits = mutableListOf<SpareOfferHit>()
    val hitBlocks =
        Regex(
            """\{[^{}]*"offerId"\s*:\s*"([^"]+)"[^{}]*\}""",
            RegexOption.DOT_MATCHES_ALL,
        ).findAll(body)
    for (block in hitBlocks) {
        val chunk = block.value
        fun f(name: String): String =
            Regex(""""$name"\s*:\s*"([^"]*)"""").find(chunk)?.groupValues?.get(1).orEmpty()
        fun n(name: String): Long {
            val s = Regex(""""$name"\s*:\s*"?(\d+)"?""").find(chunk)?.groupValues?.get(1)
            return s?.toLongOrNull() ?: 0L
        }
        hits.add(
            SpareOfferHit(
                offerId = f("offerId"),
                title = f("title"),
                unitPriceUsdMinor = n("unitPriceUsdMinor"),
                brand = f("brand"),
                oem = f("oem"),
                qualityTier = f("qualityTier"),
                offerSource = f("offerSource"),
                supplierFormality = f("supplierFormality"),
            ),
        )
    }
    return SpareSearchResult(q = q, currency = currency, sessionRole = sessionRole, hits = hits)
}

internal fun parseCheckout(body: String): SpareCheckoutResult {
    fun f(name: String): String? =
        Regex(""""$name"\s*:\s*"([^"]+)"""").find(body)?.groupValues?.get(1)
    fun n(name: String): Long {
        val s = Regex(""""$name"\s*:\s*"?(\d+)"?""").find(body)?.groupValues?.get(1)
        return s?.toLongOrNull() ?: 0L
    }
    return SpareCheckoutResult(
        ok = body.contains("\"ok\":true") || body.contains("\"ok\": true"),
        currency = f("currency") ?: "USD",
        cartTotalUsdMinor = n("cartTotalUsdMinor"),
        choice = f("choice") ?: "",
        intentId = f("intentId"),
        fxRateId = f("fxRateId"),
        soldBy = f("soldBy"),
        imttOnCheckoutLines =
            Regex(""""imttOnCheckoutLines"\s*:\s*true""")
                .containsMatchIn(body),
        cartId = f("cartId"),
    )
}

internal fun parseOrder(body: String): SpareOrderSummary {
    fun f(name: String): String =
        Regex(""""$name"\s*:\s*"([^"]*)"""").find(body)?.groupValues?.get(1).orEmpty()
    fun n(name: String): Long {
        val s = Regex(""""$name"\s*:\s*"?(\d+)"?""").find(body)?.groupValues?.get(1)
        return s?.toLongOrNull() ?: 0L
    }
    return SpareOrderSummary(
        orderId = f("orderId"),
        status = f("status"),
        currency = f("currency").ifBlank { "USD" },
        totalUsdMinor = n("totalUsdMinor"),
        payChoice = f("payChoice"),
        soldBySummary = f("soldBySummary"),
    )
}

internal fun parseOrderList(body: String): List<SpareOrderSummary> {
    val orders = mutableListOf<SpareOrderSummary>()
    val blocks =
        Regex(
            """\{[^{}]*"orderId"\s*:\s*"([^"]+)"[^{}]*\}""",
            RegexOption.DOT_MATCHES_ALL,
        ).findAll(body)
    for (block in blocks) {
        orders.add(parseOrder(block.value))
    }
    return orders
}

internal fun parseReturnClaim(body: String): SpareReturnClaim {
    fun f(name: String): String =
        Regex(""""$name"\s*:\s*"([^"]*)"""").find(body)?.groupValues?.get(1).orEmpty()
    val payableFromAi =
        Regex(""""payableFromAi"\s*:\s*true""").containsMatchIn(body)
    return SpareReturnClaim(
        claimId = f("claimId"),
        orderId = f("orderId"),
        status = f("status"),
        payableFromAi = payableFromAi,
    )
}

internal fun parseGarageVehicle(body: String): GarageVehicle {
    fun f(name: String): String =
        Regex(""""$name"\s*:\s*"([^"]*)"""").find(body)?.groupValues?.get(1).orEmpty()
    return GarageVehicle(
        vehicleId = f("vehicleId"),
        customerId = f("customerId"),
        label = f("label"),
        chassisHint = f("chassisHint"),
        reminderConsent =
            Regex(""""reminderConsent"\s*:\s*true""").containsMatchIn(body),
    )
}

internal fun parseGarageList(body: String): List<GarageVehicle> {
    val out = mutableListOf<GarageVehicle>()
    val blocks =
        Regex(
            """\{[^{}]*"vehicleId"\s*:\s*"([^"]+)"[^{}]*\}""",
            RegexOption.DOT_MATCHES_ALL,
        ).findAll(body)
    for (block in blocks) {
        out.add(parseGarageVehicle(block.value))
    }
    return out
}

internal fun parseGrocerySearch(body: String): GrocerySearchResult {
    val currency =
        Regex(""""currency"\s*:\s*"([^"]+)"""").find(body)?.groupValues?.get(1) ?: "USD"
    val q = Regex(""""q"\s*:\s*"([^"]*)"""").find(body)?.groupValues?.get(1).orEmpty()
    val liquorSkus =
        Regex(""""liquorSkus"\s*:\s*true""").containsMatchIn(body)
    val hits = mutableListOf<GroceryOfferHit>()
    val hitBlocks =
        Regex(
            """\{[^{}]*"offerId"\s*:\s*"([^"]+)"[^{}]*\}""",
            RegexOption.DOT_MATCHES_ALL,
        ).findAll(body)
    for (block in hitBlocks) {
        val chunk = block.value
        fun f(name: String): String =
            Regex(""""$name"\s*:\s*"([^"]*)"""").find(chunk)?.groupValues?.get(1).orEmpty()
        fun n(name: String): Long {
            val s = Regex(""""$name"\s*:\s*"?(\d+)"?""").find(chunk)?.groupValues?.get(1)
            return s?.toLongOrNull() ?: 0L
        }
        hits.add(
            GroceryOfferHit(
                offerId = f("offerId"),
                title = f("title"),
                unitPriceUsdMinor = n("unitPriceUsdMinor"),
                brand = f("brand"),
                unitLabel = f("unitLabel"),
                coldChain = Regex(""""coldChain"\s*:\s*true""").containsMatchIn(chunk),
                offerSource = f("offerSource"),
                supplierFormality = f("supplierFormality"),
            ),
        )
    }
    return GrocerySearchResult(q = q, currency = currency, liquorSkus = liquorSkus, hits = hits)
}

internal fun parseGroceryCheckout(body: String): GroceryCheckoutResult {
    fun f(name: String): String? =
        Regex(""""$name"\s*:\s*"([^"]+)"""").find(body)?.groupValues?.get(1)
    fun n(name: String): Long {
        val s = Regex(""""$name"\s*:\s*"?(\d+)"?""").find(body)?.groupValues?.get(1)
        return s?.toLongOrNull() ?: 0L
    }
    return GroceryCheckoutResult(
        ok = body.contains("\"ok\":true") || body.contains("\"ok\": true"),
        currency = f("currency") ?: "USD",
        cartTotalUsdMinor = n("cartTotalUsdMinor"),
        soldBy = f("soldBy"),
        imttOnCheckoutLines =
            Regex(""""imttOnCheckoutLines"\s*:\s*true""")
                .containsMatchIn(body),
    )
}
