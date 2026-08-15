package zw.co.dial.delivery.network

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class DialDeliveryClientTest {
    @Test
    fun accept_and_cod_path_never_sends_identity_in_body() {
        val bodies = mutableListOf<String>()
        val transport =
            HttpTransport { method, url, _, body, _ ->
                if (method == "POST" && url.contains("/api/delivery/courier") && body != null) {
                    bodies.add(body)
                    assertTrue(!body.contains("userId"))
                    assertTrue(!body.contains("\"role\""))
                }
                when {
                    url.endsWith("/api/auth/sign-in") ->
                        HttpResponse(
                            200,
                            """{"userId":"u1","email":"r@dial.test","buyerSegment":"b2c"}""",
                            listOf("dial_session=tok; Path=/"),
                        )
                    url.contains("seed_offer") || (body?.contains("seed_offer") == true) ->
                        HttpResponse(
                            200,
                            """{"ok":true,"offer":{"id":"dfo_1"},"job":{"id":"dj_1"}}""",
                            emptyList(),
                        )
                    body?.contains("accept_offer") == true ->
                        HttpResponse(200, """{"ok":true,"job":{"id":"dj_1","status":"assigned"}}""", emptyList())
                    body?.contains("reconcile_cod") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"reconciled":true,"amountUsdMinor":"2500","currency":"USD"}""",
                            emptyList(),
                        )
                    body?.contains("list_offline_packs") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"mapSor":"maplibre","packs":[{"packId":"harare_metro","label":"Harare","city":"Harare","mapSor":"maplibre"},{"packId":"bulawayo_metro","label":"Bulawayo","city":"Bulawayo","mapSor":"maplibre"}]}""",
                            emptyList(),
                        )
                    body?.contains("activate_offline_pack") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"installed":{"packId":"harare_metro","status":"installed","mapSor":"maplibre"}}""",
                            emptyList(),
                        )
                    else ->
                        HttpResponse(200, """{"ok":true}""", emptyList())
                }
            }
        val client = DialDeliveryClient("http://localhost:3000", MemoryCookieStore(), transport)
        client.signIn("r@dial.test", "secret12")
        val (offerId, jobId) = client.seedOffer(2500)
        assertEquals("dfo_1", offerId)
        client.acceptOffer(offerId)
        client.startTransit(jobId)
        client.postLocation(-17.83, 31.05, jobId)
        client.capturePod(jobId)
        val cod = client.reconcileCod(jobId)
        assertTrue(cod.reconciled)
        assertEquals(2500L, cod.amountUsdMinor)
        val packs = client.listOfflinePacks()
        assertEquals(2, packs.size)
        assertTrue(packs.all { it.mapSor == "maplibre" })
        val install = client.activateOfflinePack("harare_metro")
        assertEquals("installed", install.status)
        assertTrue(bodies.all { !it.contains("userId") })
    }

    @Test
    fun reject_invalid_availability() {
        val client = DialDeliveryClient("http://localhost:3000")
        assertFailsWith<IllegalArgumentException> {
            client.setAvailability("flying")
        }
    }
}
