package zw.co.dial.technician.network

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class DialTechnicianClientTest {
    @Test
    fun seed_checklist_evidence_never_sends_identity_in_body() {
        val bodies = mutableListOf<String>()
        val transport =
            HttpTransport { method, url, _, body, _ ->
                if (method == "POST" && url.contains("/api/tech/technician") && body != null) {
                    bodies.add(body)
                    assertTrue(!body.contains("userId"))
                    assertTrue(!body.contains("\"role\""))
                }
                when {
                    url.endsWith("/api/auth/sign-in") ->
                        HttpResponse(
                            200,
                            """{"userId":"u1","email":"t@dial.test","buyerSegment":"b2c"}""",
                            listOf("dial_session=tok; Path=/"),
                        )
                    body?.contains("seed_assigned_job") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"job":{"id":"job_1","status":"assigned","jobClassId":"jc_diag","draftAmountUsdMinor":"4500"}}""",
                            emptyList(),
                        )
                    body?.contains("start_checklist") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"run":{"runId":"cr_1","checklistId":"automotive_basic","stepIndex":0,"status":"in_progress"}}""",
                            emptyList(),
                        )
                    body?.contains("advance_checklist") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"run":{"runId":"cr_1","checklistId":"automotive_basic","stepIndex":4,"status":"completed"}}""",
                            emptyList(),
                        )
                    body?.contains("upload_evidence") == true ->
                        HttpResponse(200, """{"ok":true,"evidence":{"evidenceId":"ev_1"}}""", emptyList())
                    body?.contains("take_home_preview") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"netPayoutMinor":"7000","withholdMinor":"3000","rateBps":3000}""",
                            emptyList(),
                        )
                    else -> HttpResponse(200, """{"ok":true,"jobs":[]}""", emptyList())
                }
            }
        val client = DialTechnicianClient("http://localhost:3000", MemoryCookieStore(), transport)
        client.signIn("t@dial.test", "secret12")
        val job = client.seedAssignedJob()
        assertEquals("job_1", job.id)
        val run = client.startChecklist(job.id)
        assertEquals("cr_1", run.runId)
        val done = client.advanceChecklist(run.runId)
        assertEquals("completed", done.status)
        client.uploadEvidence(job.id, "photo", "data:image/jpeg;base64,x")
        val th = client.takeHomePreview(10_000, hasItf263 = false)
        assertEquals(3000L, th.withholdMinor)
        assertEquals(7000L, th.netPayoutMinor)
        assertTrue(bodies.all { !it.contains("userId") })
    }
}
