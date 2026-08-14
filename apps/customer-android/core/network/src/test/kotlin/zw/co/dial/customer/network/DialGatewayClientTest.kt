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
                        """{"q":"filter","currency":"USD","sessionRole":"b2c","hits":[{"offerId":"o1","title":"Oil filter","unitPriceUsdMinor":"1250","brand":"Bosch","oem":"OEM1","qualityTier":"OEM","offerSource":"MARKETPLACE","supplierFormality":"formal"}]}""",
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
            HttpTransport { method, url, _, body, _ ->
                assertEquals("POST", method)
                assertTrue(url.endsWith("/api/spare/checkout"))
                assertTrue(body!!.contains("\"choice\":\"ecocash\""))
                assertTrue(!body.contains("userId"))
                assertTrue(!body.contains("\"role\""))
                HttpResponse(
                    statusCode = 200,
                    body =
                        """{"ok":true,"currency":"USD","cartTotalUsdMinor":"1250","choice":"ecocash","intentId":"pi_1","fxRateId":"fx_1","soldBy":"Sold by Bosch","imttOnCheckoutLines":false}""",
                    setCookieHeaders = emptyList(),
                )
            }
        val client = DialGatewayClient("http://localhost:3000", MemoryCookieStore(), transport)
        val result = client.checkoutSpare("o1", "ecocash")
        assertTrue(result.ok)
        assertEquals("USD", result.currency)
        assertEquals(false, result.imttOnCheckoutLines)
        assertEquals("pi_1", result.intentId)
    }
}