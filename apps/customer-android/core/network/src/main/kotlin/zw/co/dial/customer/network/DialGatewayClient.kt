package zw.co.dial.customer.network

/**
 * Gateway ERP client for customer-android (PD5).
 * Session SoR = dial_session cookie from Set-Cookie — never body userId/role (D-47).
 * Browse/cart currency = USD (D-57).
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
    )
}
