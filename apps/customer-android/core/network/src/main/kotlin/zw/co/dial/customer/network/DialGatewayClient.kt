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
    /** Agency disclosure — Sold by {Supplier} Agency (D-58 / PD42). */
    val soldBy: String,
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
    /** Agency supplier display name (D-58 / PD42). */
    val supplierDisplayName: String,
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
    val groceryOrderId: String? = null,
)

data class GroceryTrackResult(
    val orderId: String,
    val status: String,
    val statusFrom: String,
    val currency: String,
    val totalUsdMinor: Long,
    val payChoice: String,
    val soldBy: String,
    val liquorAllowed: Boolean,
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
        // D-47: never send userId/role in body. PD97: Idempotency-Key required.
        val body =
            """{"offerId":${jsonString(offerId)},"choice":${jsonString(choice)},"qty":$qty}"""
        val idem =
            "android-$choice-$offerId-${System.currentTimeMillis()}"
        val res =
            transport.request(
                method = "POST",
                url = "$baseUrl/api/spare/checkout",
                headers =
                    mapOf(
                        "Content-Type" to "application/json",
                        "Accept" to "application/json",
                        "Idempotency-Key" to idem,
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

    /** PD42 — grocery ERP track parity with web `/api/grocery/track`. */
    fun trackGrocery(orderId: String): GroceryTrackResult {
        val encoded = java.net.URLEncoder.encode(orderId, Charsets.UTF_8)
        val res =
            transport.request(
                method = "GET",
                url = "$baseUrl/api/grocery/track?orderId=$encoded",
                headers = mapOf("Accept" to "application/json"),
                body = null,
                cookieHeader = cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialGatewayException(
                parseError(res.body) ?: "grocery track failed",
                res.statusCode,
            )
        }
        return parseGroceryTrack(res.body)
    }

    /** PD21 — validate / apply promo code (draft only; D-42). */
    fun validatePromoCode(code: String, vertical: String = "spare"): PromoCodeResult {
        val body =
            """{"action":"validate_code","code":${jsonString(code)},"vertical":${jsonString(vertical)}}"""
        require(!body.contains("userId") && !body.contains("\"role\""))
        val res =
            transport.request(
                method = "POST",
                url = "$baseUrl/api/promo",
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
                parseError(res.body) ?: "promo validate failed",
                res.statusCode,
            )
        }
        return parsePromoCodeResult(res.body)
    }

    fun applyPromoCodeDraft(
        code: String,
        cartId: String,
        vertical: String = "spare",
    ): PromoCodeResult {
        val body =
            """{"action":"apply_draft","code":${jsonString(code)},"cartId":${jsonString(cartId)},"vertical":${jsonString(vertical)}}"""
        require(!body.contains("userId") && !body.contains("\"role\""))
        val res =
            transport.request(
                method = "POST",
                url = "$baseUrl/api/promo",
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
                parseError(res.body) ?: "promo apply failed",
                res.statusCode,
            )
        }
        return parsePromoCodeResult(res.body)
    }

    fun shareReferral(campaignId: String, codeSuffix: String? = null): ReferralShareResult {
        val body =
            buildString {
                append("""{"action":"share_referral","campaignId":${jsonString(campaignId)}""")
                if (!codeSuffix.isNullOrBlank()) {
                    append(""","codeSuffix":${jsonString(codeSuffix)}""")
                }
                append("}")
            }
        require(!body.contains("\"role\""))
        val res =
            transport.request(
                method = "POST",
                url = "$baseUrl/api/promo",
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
                parseError(res.body) ?: "referral share failed",
                res.statusCode,
            )
        }
        return parseReferralShare(res.body)
    }

    fun attemptPromoCashOut(amountMinor: Long): Boolean {
        val body =
            """{"action":"attempt_cash_out","amountMinor":"$amountMinor"}"""
        val res =
            transport.request(
                method = "POST",
                url = "$baseUrl/api/promo",
                headers =
                    mapOf(
                        "Content-Type" to "application/json",
                        "Accept" to "application/json",
                    ),
                body = body,
                cookieHeader = cookies.getCookieHeader(),
            )
        // 403 + promo_credit_cash_out_forbidden = expected (D-42)
        if (res.statusCode == 403 && res.body.contains("promo_credit_cash_out_forbidden")) {
            return false
        }
        throw DialGatewayException(
            parseError(res.body) ?: "unexpected cash-out response",
            res.statusCode,
        )
    }

    /** PD21 — tech deep-link (rate_card draft; payableFromAi=false). */
    fun techHome(): TechHomeResult {
        val res =
            transport.request(
                method = "GET",
                url = "$baseUrl/api/tech/services",
                headers = mapOf("Accept" to "application/json"),
                body = null,
                cookieHeader = cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialGatewayException(
                parseError(res.body) ?: "tech home failed",
                res.statusCode,
            )
        }
        return parseTechHome(res.body)
    }

    fun techSlots(): TechSlotsResult {
        val res =
            transport.request(
                method = "GET",
                url = "$baseUrl/api/tech/services?view=slots",
                headers = mapOf("Accept" to "application/json"),
                body = null,
                cookieHeader = cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialGatewayException(
                parseError(res.body) ?: "tech slots failed",
                res.statusCode,
            )
        }
        return parseTechSlots(res.body)
    }

    fun bookTechGuide(slotId: String): TechBookResult {
        val body =
            """{"action":"book","slotId":${jsonString(slotId)},"jobClass":"diagnostics","emergency":false}"""
        require(!body.contains("userId") && !body.contains("\"role\""))
        val res =
            transport.request(
                method = "POST",
                url = "$baseUrl/api/tech/services",
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
                parseError(res.body) ?: "tech book failed",
                res.statusCode,
            )
        }
        return parseTechBook(res.body)
    }

    fun cookieStore(): CookieStore = cookies
}

data class PromoCodeResult(
    val ok: Boolean,
    val code: String?,
    val draftDiscountPercent: Int,
    val payableFromAi: Boolean,
    val cashOutAllowed: Boolean,
)

data class ReferralShareResult(
    val shareCode: String,
    val shareUrl: String,
    val cashOutAllowed: Boolean,
    val rewardKind: String,
)

data class TechHomeResult(
    val guideTitle: String,
    val aiHypeForbidden: Boolean,
)

data class TechSlotsResult(
    val slotIds: List<String>,
    val quoteSource: String,
    val draftAmountUsdMinor: Long,
    val payableFromAi: Boolean,
)

data class TechBookResult(
    val jobId: String,
    val draftOnly: Boolean,
    val payableFromAi: Boolean,
    val draftAmountUsdMinor: Long,
)

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
                soldBy = f("soldBy").ifBlank { "${f("brand")} Agency" },
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
                supplierDisplayName = f("supplierDisplayName").ifBlank { f("brand") },
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
        groceryOrderId = f("groceryOrderId"),
    )
}

internal fun parseGroceryTrack(body: String): GroceryTrackResult {
    fun f(name: String): String =
        Regex(""""$name"\s*:\s*"([^"]*)"""").find(body)?.groupValues?.get(1).orEmpty()
    fun n(name: String): Long {
        val s = Regex(""""$name"\s*:\s*"?(\d+)"?""").find(body)?.groupValues?.get(1)
        return s?.toLongOrNull() ?: 0L
    }
    return GroceryTrackResult(
        orderId = f("orderId"),
        status = f("status"),
        statusFrom = f("statusFrom").ifBlank { "erp" },
        currency = f("currency").ifBlank { "USD" },
        totalUsdMinor = n("totalUsdMinor"),
        payChoice = f("payChoice"),
        soldBy = f("soldBy"),
        liquorAllowed = Regex(""""liquorAllowed"\s*:\s*true""").containsMatchIn(body),
    )
}

internal fun parsePromoCodeResult(body: String): PromoCodeResult {
    fun f(name: String): String? =
        Regex(""""$name"\s*:\s*"([^"]+)"""").find(body)?.groupValues?.get(1)
    fun n(name: String): Int {
        val s = Regex(""""$name"\s*:\s*"?(\d+)"?""").find(body)?.groupValues?.get(1)
        return s?.toIntOrNull() ?: 0
    }
    val nested =
        Regex(""""applied"\s*:\s*\{([^}]*)\}""").find(body)?.groupValues?.get(1)
    val source = nested ?: body
    return PromoCodeResult(
        ok =
            body.contains("\"ok\":true") ||
                body.contains("\"ok\": true") ||
                Regex(""""ok"\s*:\s*true""").containsMatchIn(source),
        code = f("code") ?: Regex(""""code"\s*:\s*"([^"]+)"""").find(source)?.groupValues?.get(1),
        draftDiscountPercent =
            n("draftDiscountPercent").takeIf { it > 0 }
                ?: Regex(""""draftDiscountPercent"\s*:\s*"?(\d+)"?""")
                    .find(source)
                    ?.groupValues
                    ?.get(1)
                    ?.toIntOrNull()
                ?: 0,
        payableFromAi = Regex(""""payableFromAi"\s*:\s*true""").containsMatchIn(body),
        cashOutAllowed = Regex(""""cashOutAllowed"\s*:\s*true""").containsMatchIn(body),
    )
}

internal fun parseReferralShare(body: String): ReferralShareResult {
    fun f(name: String): String =
        Regex(""""$name"\s*:\s*"([^"]*)"""").find(body)?.groupValues?.get(1).orEmpty()
    return ReferralShareResult(
        shareCode = f("shareCode"),
        shareUrl = f("shareUrl"),
        cashOutAllowed = Regex(""""cashOutAllowed"\s*:\s*true""").containsMatchIn(body),
        rewardKind = f("rewardKind").ifBlank { "promo_credit" },
    )
}

internal fun parseTechHome(body: String): TechHomeResult {
    fun f(name: String): String =
        Regex(""""$name"\s*:\s*"([^"]*)"""").find(body)?.groupValues?.get(1).orEmpty()
    return TechHomeResult(
        guideTitle = f("title").ifBlank { "Dial a Tech" },
        aiHypeForbidden =
            !Regex(""""aiHypeForbidden"\s*:\s*false""").containsMatchIn(body),
    )
}

internal fun parseTechSlots(body: String): TechSlotsResult {
    fun f(name: String): String =
        Regex(""""$name"\s*:\s*"([^"]*)"""").find(body)?.groupValues?.get(1).orEmpty()
    fun n(name: String): Long {
        val s = Regex(""""$name"\s*:\s*"?(\d+)"?""").find(body)?.groupValues?.get(1)
        return s?.toLongOrNull() ?: 0L
    }
    val slotIds = mutableListOf<String>()
    Regex(""""(?:slotId|id)"\s*:\s*"([^"]+)"""").findAll(body).forEach {
        slotIds.add(it.groupValues[1])
    }
    return TechSlotsResult(
        slotIds = slotIds.distinct(),
        quoteSource = f("source").ifBlank { "rate_card" },
        draftAmountUsdMinor = n("draftAmountUsdMinor"),
        payableFromAi = Regex(""""payableFromAi"\s*:\s*true""").containsMatchIn(body),
    )
}

internal fun parseTechBook(body: String): TechBookResult {
    fun f(name: String): String =
        Regex(""""$name"\s*:\s*"([^"]*)"""").find(body)?.groupValues?.get(1).orEmpty()
    fun n(name: String): Long {
        val s = Regex(""""$name"\s*:\s*"?(\d+)"?""").find(body)?.groupValues?.get(1)
        return s?.toLongOrNull() ?: 0L
    }
    return TechBookResult(
        jobId = f("id").ifBlank { f("jobId") },
        draftOnly =
            body.contains("\"draftOnly\":true") || body.contains("\"draftOnly\": true") ||
                !Regex(""""draftOnly"\s*:\s*false""").containsMatchIn(body),
        payableFromAi = Regex(""""payableFromAi"\s*:\s*true""").containsMatchIn(body),
        draftAmountUsdMinor = n("draftAmountUsdMinor"),
    )
}
