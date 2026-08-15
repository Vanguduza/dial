package zw.co.dial.customer.network

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class DialGatewayClientTest {
    @Test
    fun signIn_stores_dial_session_cookie_and_parses_session() {
        val store = MemoryCookieStore()
        val transport =
            HttpTransport { method, url, _, body, _ ->
                assertEquals("POST", method)
                assertTrue(url.endsWith("/api/auth/sign-in"))
                assertTrue(body!!.contains("\"email\""))
                assertTrue(!body.contains("userId"))
                assertTrue(!body.contains("\"role\""))
                HttpResponse(
                    statusCode = 200,
                    body =
                        """{"userId":"u1","email":"buyer@dial.test","buyerSegment":"b2c"}""",
                    setCookieHeaders = listOf("dial_session=tok_abc; Path=/; HttpOnly"),
                )
            }
        val client = DialGatewayClient("http://localhost:3000", store, transport)
        val session = client.signIn("buyer@dial.test", "secret123")
        assertEquals("u1", session.userId)
        assertEquals("buyer@dial.test", session.email)
        assertEquals("dial_session=tok_abc", store.getCookieHeader())
    }

    @Test
    fun searchSpare_requires_usd_currency_in_contract() {
        val transport =
            HttpTransport { _, url, _, _, cookie ->
                assertTrue(url.contains("/api/search/spare"))
                assertTrue(!url.contains("role="))
                assertEquals("dial_session=tok", cookie)
                HttpResponse(
                    statusCode = 200,
                    body =
                        """{"q":"filter","currency":"USD","sessionRole":"b2c","hits":[{"offerId":"o1","title":"Oil filter","unitPriceUsdMinor":"1250","brand":"Bosch","oem":"OEM1","qualityTier":"OEM","offerSource":"MARKETPLACE","supplierFormality":"formal","soldBy":"Bosch Agency"}]}""",
                    setCookieHeaders = emptyList(),
                )
            }
        val store = MemoryCookieStore()
        store.storeFromSetCookie(listOf("dial_session=tok; Path=/"))
        val client = DialGatewayClient("http://localhost:3000", store, transport)
        val result = client.searchSpare("filter")
        assertEquals("USD", result.currency)
        assertEquals(1, result.hits.size)
        assertEquals(1250L, result.hits[0].unitPriceUsdMinor)
        assertEquals("MARKETPLACE", result.hits[0].offerSource)
        assertEquals("Bosch Agency", result.hits[0].soldBy)
    }

    @Test
    fun checkoutSpare_rejects_non_button_choice() {
        val client = DialGatewayClient("http://localhost:3000")
        assertFailsWith<IllegalArgumentException> {
            client.checkoutSpare("o1", "paypal")
        }
    }

    @Test
    fun checkoutSpare_posts_ecocash_without_identity_in_body() {
        val transport =
            HttpTransport { method, url, headers, body, _ ->
                assertEquals("POST", method)
                assertTrue(url.endsWith("/api/spare/checkout"))
                assertTrue(headers["Idempotency-Key"]!!.isNotBlank())
                assertTrue(body!!.contains("\"choice\":\"ecocash\""))
                assertTrue(!body.contains("userId"))
                assertTrue(!body.contains("\"role\""))
                HttpResponse(
                    statusCode = 200,
                    body =
                        """{"ok":true,"currency":"USD","cartTotalUsdMinor":"1250","choice":"ecocash","intentId":"pi_1","fxRateId":"fx_1","soldBy":"Sold by Bosch","imttOnCheckoutLines":false,"cartId":"cart_1"}""",
                    setCookieHeaders = emptyList(),
                )
            }
        val client = DialGatewayClient("http://localhost:3000", MemoryCookieStore(), transport)
        val result = client.checkoutSpare("o1", "ecocash")
        assertTrue(result.ok)
        assertEquals("USD", result.currency)
        assertEquals(false, result.imttOnCheckoutLines)
        assertEquals("pi_1", result.intentId)
        assertEquals("cart_1", result.cartId)
    }

    @Test
    fun pd20_place_track_return_garage_and_grocery_usd() {
        var step = 0
        val transport =
            HttpTransport { method, url, _, body, _ ->
                when {
                    method == "POST" && url.endsWith("/api/spare/orders") -> {
                        assertTrue(body!!.contains("\"payChoice\":\"cod\""))
                        assertTrue(!body.contains("\"role\""))
                        step++
                        HttpResponse(
                            statusCode = 200,
                            body =
                                """{"ok":true,"order":{"orderId":"sord_1","status":"confirmed","currency":"USD","totalUsdMinor":"1250","payChoice":"cod","soldBySummary":"Bosch"}}""",
                        )
                    }
                    method == "GET" && url.contains("orderId=") -> {
                        step++
                        HttpResponse(
                            statusCode = 200,
                            body =
                                """{"order":{"orderId":"sord_1","status":"awaiting_supplier","currency":"USD","totalUsdMinor":"1250","payChoice":"cod","soldBySummary":"Bosch"},"statusFrom":"erp","zigOnTrack":false}""",
                        )
                    }
                    method == "POST" && url.endsWith("/api/spare/returns") -> {
                        assertTrue(body!!.contains("\"action\":\"open\""))
                        step++
                        HttpResponse(
                            statusCode = 200,
                            body =
                                """{"ok":true,"claim":{"claimId":"sret_1","orderId":"sord_1","status":"opened","payableFromAi":false}}""",
                        )
                    }
                    method == "POST" && url.endsWith("/api/spare/garage") -> {
                        assertTrue(body!!.contains("\"reminderConsent\":true"))
                        step++
                        HttpResponse(
                            statusCode = 200,
                            body =
                                """{"ok":true,"vehicle":{"vehicleId":"veh_1","customerId":"u1","label":"Hilux","chassisHint":"KUN26","reminderConsent":true}}""",
                        )
                    }
                    method == "GET" && url.contains("/api/search/grocery") -> {
                        assertTrue(!url.contains("role="))
                        step++
                        HttpResponse(
                            statusCode = 200,
                            body =
                                """{"q":"mealie","currency":"USD","liquorSkus":false,"hits":[{"offerId":"g1","title":"Mealie meal","unitPriceUsdMinor":"500","brand":"Ngwena","unitLabel":"2kg","coldChain":false,"offerSource":"MARKETPLACE","supplierFormality":"formal","supplierDisplayName":"OK Express Agency"}]}""",
                        )
                    }
                    method == "GET" && url.contains("/api/grocery/track") -> {
                        step++
                        HttpResponse(
                            statusCode = 200,
                            body =
                                """{"orderId":"gord_1","status":"confirmed","statusFrom":"erp","currency":"USD","totalUsdMinor":"500","payChoice":"cod","soldBy":"OK Express Agency","liquorAllowed":false}""",
                        )
                    }
                    else -> error("unexpected $method $url")
                }
            }
        val client = DialGatewayClient("http://localhost:3000", MemoryCookieStore(), transport)
        val order = client.placeSpareOrder("cart_1", "cod", "u1")
        assertEquals("sord_1", order.orderId)
        assertEquals("USD", order.currency)
        val track = client.trackSpareOrder("sord_1")
        assertEquals(false, track.zigOnTrack)
        val claim = client.openSpareReturn("sord_1")
        assertEquals(false, claim.payableFromAi)
        val vehicle = client.addGarageVehicle("u1", "Hilux", "KUN26", true)
        assertTrue(vehicle.reminderConsent)
        val grocery = client.searchGrocery("mealie")
        assertEquals("USD", grocery.currency)
        assertEquals(false, grocery.liquorSkus)
        assertEquals("OK Express Agency", grocery.hits[0].supplierDisplayName)
        val gTrack = client.trackGrocery("gord_1")
        assertEquals("OK Express Agency", gTrack.soldBy)
        assertEquals(false, gTrack.liquorAllowed)
        assertEquals(6, step)
    }

    @Test
    fun pd21_promo_referral_and_tech_deep_link() {
        var step = 0
        val transport =
            HttpTransport { method, url, _, body, _ ->
                when {
                    method == "POST" && url.endsWith("/api/promo") && body!!.contains("validate_code") -> {
                        assertTrue(!body.contains("userId"))
                        step++
                        HttpResponse(
                            statusCode = 200,
                            body =
                                """{"ok":true,"code":"SPARE10","draftDiscountPercent":10,"payableFromAi":false,"cashOutAllowed":false}""",
                        )
                    }
                    method == "POST" && url.endsWith("/api/promo") && body!!.contains("share_referral") -> {
                        step++
                        HttpResponse(
                            statusCode = 200,
                            body =
                                """{"ok":true,"share":{"shareCode":"PD21-ALICE","shareUrl":"https://dial.zw/r/PD21-ALICE","cashOutAllowed":false,"rewardKind":"promo_credit"}}""",
                        )
                    }
                    method == "POST" && url.endsWith("/api/promo") && body!!.contains("attempt_cash_out") -> {
                        step++
                        HttpResponse(
                            statusCode = 403,
                            body = """{"ok":false,"error":"promo_credit_cash_out_forbidden","cashOutAllowed":false}""",
                        )
                    }
                    method == "GET" && url.contains("/api/tech/services?view=slots") -> {
                        step++
                        HttpResponse(
                            statusCode = 200,
                            body =
                                """{"slots":[{"id":"slot_1"}],"quote":{"source":"rate_card","draftAmountUsdMinor":"4500","payableFromAi":false}}""",
                        )
                    }
                    method == "POST" && url.endsWith("/api/tech/services") -> {
                        assertTrue(body!!.contains("\"action\":\"book\""))
                        assertTrue(!body.contains("userId"))
                        step++
                        HttpResponse(
                            statusCode = 200,
                            body =
                                """{"ok":true,"job":{"id":"job_1","draftOnly":true,"payableFromAi":false},"quote":{"draftAmountUsdMinor":"4500","payableFromAi":false,"source":"rate_card"}}""",
                        )
                    }
                    else -> error("unexpected $method $url $body")
                }
            }
        val client = DialGatewayClient("http://localhost:3000", MemoryCookieStore(), transport)
        val promo = client.validatePromoCode("SPARE10")
        assertEquals(true, promo.ok)
        assertEquals(false, promo.payableFromAi)
        assertEquals(false, promo.cashOutAllowed)
        val share = client.shareReferral("pcamp_1", "alice")
        assertEquals("PD21-ALICE", share.shareCode)
        assertEquals(false, share.cashOutAllowed)
        assertEquals(false, client.attemptPromoCashOut(300))
        val slots = client.techSlots()
        assertEquals(false, slots.payableFromAi)
        assertEquals("rate_card", slots.quoteSource)
        val book = client.bookTechGuide(slots.slotIds.first())
        assertEquals(false, book.payableFromAi)
        assertEquals(true, book.draftOnly)
        assertEquals(5, step)
    }
}
