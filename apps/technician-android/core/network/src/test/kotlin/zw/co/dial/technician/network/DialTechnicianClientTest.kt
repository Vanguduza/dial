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
                    body?.contains("upload_itf263") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"itf263":{"recordId":"itf_1","status":"uploaded_pending","documentRef":"fixture://x.pdf","certificatePdfRef":null}}""",
                            emptyList(),
                        )
                    body?.contains("verify_itf263_fixture") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"itf263":{"recordId":"itf_1","status":"verified","documentRef":"fixture://x.pdf","certificatePdfRef":null}}""",
                            emptyList(),
                        )
                    body?.contains("take_home_breakdown") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"grossUsdMinor":"12000","dialFeeUsdMinor":"2000","taxableShareUsdMinor":"10000","withholdMinor":"0","netPayoutMinor":"10000","rateBps":0,"hasItf263":true,"itf263Status":"verified","certificatePdfRef":null,"payableFromAi":false}""",
                            emptyList(),
                        )
                    url.contains("view=value_score") ->
                        HttpResponse(
                            200,
                            """{"technicianId":"tech_t","valueScore":{"technicianId":"tech_t","score":78,"confidence":"high","factorContributions":[{"factor":"completion","weight":0.35,"contribution":28},{"factor":"punctuality","weight":0.25,"contribution":20}]},"payableFromAi":false}""",
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
        val vs = client.fetchValueScore()
        assertEquals(78, vs.score)
        assertTrue(vs.factorContributions.isNotEmpty())
        val uploaded = client.uploadItf263("fixture://x.pdf")
        assertEquals("uploaded_pending", uploaded.status)
        val verified = client.verifyItf263Fixture()
        assertEquals("verified", verified.status)
        val bd = client.takeHomeBreakdown(12_000, 2_000)
        assertEquals(0, bd.rateBps)
        assertEquals(false, bd.payableFromAi)
        assertTrue(bodies.all { !it.contains("userId") })
    }

    @Test
    fun pd30_check_in_and_camera_never_sends_identity() {
        val bodies = mutableListOf<String>()
        val transport =
            HttpTransport { method, url, _, body, _ ->
                if (method == "POST" && url.contains("/api/tech/technician") && body != null) {
                    bodies.add(body)
                    assertTrue(!body.contains("userId"))
                    assertTrue(!body.contains("\"role\""))
                }
                when {
                    body?.contains("check_in") == true && body.contains("\"isMockLocation\":true") ->
                        HttpResponse(
                            200,
                            """{"ok":true,"checkIn":{"accepted":false,"reason":"mock_location_blocked","isMockLocation":true,"punctualityEligible":false,"distanceMeters":0},"payableFromAi":false}""",
                            emptyList(),
                        )
                    body?.contains("check_in") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"checkIn":{"accepted":true,"reason":"ok","isMockLocation":false,"punctualityEligible":true,"distanceMeters":33},"payableFromAi":false}""",
                            emptyList(),
                        )
                    body?.contains("capture_camera_evidence") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"camera":{"evidenceId":"evcam_1","overlayChecklistStep":"Photo of fault area (optional)","cameraSource":"device_camera","flushStatus":"queued","payableFromAi":false}}""",
                            emptyList(),
                        )
                    body?.contains("flush_evidence_queue") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"flushed":1,"evidenceIds":["evcam_1"],"payableFromAi":false}""",
                            emptyList(),
                        )
                    else -> HttpResponse(200, """{"ok":true}""", emptyList())
                }
            }
        val client = DialTechnicianClient("http://localhost:3000", MemoryCookieStore(), transport)
        val mock = client.checkIn("job_1", -17.8292, 31.0522, isMockLocation = true)
        assertEquals(false, mock.accepted)
        assertEquals("mock_location_blocked", mock.reason)
        val genuine = client.checkIn("job_1", -17.8292, 31.0522, isMockLocation = false)
        assertEquals(true, genuine.punctualityEligible)
        val cam =
            client.captureCameraEvidence(
                "job_1",
                "data:image/jpeg;base64,x",
                "Photo of fault area (optional)",
            )
        assertEquals("device_camera", cam.cameraSource)
        assertEquals(false, cam.payableFromAi)
        assertEquals(1, client.flushEvidenceQueue())
        assertTrue(bodies.all { !it.contains("userId") })
    }

    @Test
    fun g6_checklist_complete_evidence_itf263_wht_path() {
        var advanceCalls = 0
        val transport =
            HttpTransport { method, url, _, body, _ ->
                if (method == "POST" && url.contains("/api/tech/technician") && body != null) {
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
                            """{"ok":true,"job":{"id":"job_g6","status":"assigned","jobClassId":"jc_diag","draftAmountUsdMinor":"4500"}}""",
                            emptyList(),
                        )
                    body?.contains("start_checklist") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"run":{"runId":"cr_g6","checklistId":"automotive_basic","stepIndex":0,"status":"in_progress"}}""",
                            emptyList(),
                        )
                    body?.contains("advance_checklist") == true -> {
                        advanceCalls += 1
                        val status = if (advanceCalls >= 4) "completed" else "in_progress"
                        val step = if (advanceCalls >= 4) 4 else advanceCalls
                        HttpResponse(
                            200,
                            """{"ok":true,"run":{"runId":"cr_g6","checklistId":"automotive_basic","stepIndex":$step,"status":"$status"}}""",
                            emptyList(),
                        )
                    }
                    body?.contains("upload_evidence") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"evidence":{"evidenceId":"ev_g6"}}""",
                            emptyList(),
                        )
                    body?.contains("capture_camera_evidence") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"camera":{"evidenceId":"evcam_g6","overlayChecklistStep":"Photo of fault area (optional)","cameraSource":"device_camera","flushStatus":"queued","payableFromAi":false}}""",
                            emptyList(),
                        )
                    body?.contains("flush_evidence_queue") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"flushed":1,"evidenceIds":["evcam_g6"],"payableFromAi":false}""",
                            emptyList(),
                        )
                    body?.contains("upload_itf263") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"itf263":{"recordId":"itf_g6","status":"uploaded_pending","documentRef":"fixture://g6.pdf","certificatePdfRef":null}}""",
                            emptyList(),
                        )
                    body?.contains("verify_itf263_fixture") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"itf263":{"recordId":"itf_g6","status":"verified","documentRef":"fixture://g6.pdf","certificatePdfRef":null}}""",
                            emptyList(),
                        )
                    body?.contains("take_home_breakdown") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"grossUsdMinor":"12000","dialFeeUsdMinor":"2000","taxableShareUsdMinor":"10000","withholdMinor":"0","netPayoutMinor":"10000","rateBps":0,"hasItf263":true,"itf263Status":"verified","certificatePdfRef":null,"payableFromAi":false}""",
                            emptyList(),
                        )
                    else -> HttpResponse(200, """{"ok":true,"jobs":[]}""", emptyList())
                }
            }
        val client = DialTechnicianClient("http://localhost:3000", MemoryCookieStore(), transport)
        client.signIn("t@dial.test", "secret12")
        val job = client.seedAssignedJob()
        val run = client.startChecklist(job.id)
        var done = run
        while (done.status != "completed") {
            done = client.advanceChecklist(run.runId)
        }
        assertEquals("completed", done.status)
        assertEquals(4, advanceCalls)
        client.uploadEvidence(job.id, "photo", "data:image/jpeg;base64,g6")
        val cam =
            client.captureCameraEvidence(
                job.id,
                "data:image/jpeg;base64,g6cam",
                "Photo of fault area (optional)",
            )
        assertEquals("queued", cam.flushStatus)
        assertEquals(1, client.flushEvidenceQueue())
        val verified = client.verifyItf263Fixture()
        assertEquals("verified", verified.status)
        val bd = client.takeHomeBreakdown(12_000, 2_000)
        assertEquals(true, bd.hasItf263)
        assertEquals(false, bd.payableFromAi)
    }

    @Test
    fun pd31_thermal_print_never_sends_identity() {
        val bodies = mutableListOf<String>()
        val transport =
            HttpTransport { method, url, _, body, _ ->
                if (method == "POST" && url.contains("/api/tech/technician") && body != null) {
                    bodies.add(body)
                    assertTrue(!body.contains("userId"))
                    assertTrue(!body.contains("\"role\""))
                }
                when {
                    body?.contains("pair_thermal_printer") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"printer":{"printerId":"btp_1","label":"DIAL pocket thermal","bluetoothAddress":"AA:BB:CC:31:00:01","protocol":"escpos","zimraFiscalSor":false,"fdmsVirtualOnly":true},"payableFromAi":false}""",
                            emptyList(),
                        )
                    body?.contains("print_job_ticket") == true ->
                        HttpResponse(
                            200,
                            """{"ok":true,"printJob":{"printJobId":"prj_1","jobId":"job_1","status":"sent","zimraFiscalSor":false,"payableFromAi":false}}""",
                            emptyList(),
                        )
                    else -> HttpResponse(200, """{"ok":true}""", emptyList())
                }
            }
        val client = DialTechnicianClient("http://localhost:3000", MemoryCookieStore(), transport)
        val printer = client.pairThermalPrinter()
        assertEquals("escpos", printer.protocol)
        assertEquals(false, printer.zimraFiscalSor)
        assertEquals(true, printer.fdmsVirtualOnly)
        val ticket = client.printJobTicket("job_1", printer.printerId)
        assertEquals("sent", ticket.status)
        assertEquals(false, ticket.zimraFiscalSor)
        assertEquals(false, ticket.payableFromAi)
        assertTrue(bodies.all { !it.contains("userId") })
    }
}
