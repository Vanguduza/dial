package zw.co.dial.technician.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import zw.co.dial.technician.network.DialTechnicianClient
import zw.co.dial.technician.network.MemoryCookieStore

/**
 * Pack §9.7 thin UI: jobs → checklist runner → evidence → Take-Home WHT (D-50).
 * Now in Android module layout; FixItNow/Cal.com book path is gateway /tech/book.
 */
@Composable
fun TechnicianApp(baseUrl: String) {
    val cookies = remember { MemoryCookieStore() }
    val client = remember { DialTechnicianClient(baseUrl, cookies) }
    var signedIn by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var jobId by remember { mutableStateOf<String?>(null) }
    var runId by remember { mutableStateOf<String?>(null) }
    var status by remember { mutableStateOf("Sign in to run jobs / checklist / evidence.") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    fun run(block: () -> Unit) {
        loading = true
        error = null
        scope.launch {
            try {
                withContext(Dispatchers.IO) { block() }
            } catch (e: Exception) {
                error = e.message
            } finally {
                loading = false
            }
        }
    }

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(
            "DIAL Technician",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
        )
        Text(
            "Compose · mock GPS · camera overlay · Value Score · ITF263 · Take-Home",
            style = MaterialTheme.typography.bodySmall,
        )

        if (!signedIn) {
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                modifier = Modifier.fillMaxWidth(),
            )
            Button(
                onClick = {
                    run {
                        client.signIn(email.trim(), password)
                        signedIn = true
                        status = "Signed in — seed job or open inbox"
                    }
                },
                enabled = !loading,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Sign in")
            }
        } else {
            Text(status, style = MaterialTheme.typography.bodyMedium)
            Button(
                onClick = {
                    run {
                        val job = client.seedAssignedJob()
                        jobId = job.id
                        status = "Job ${job.id} · ${job.jobClassId} · draft USD ${(job.draftAmountUsdMinor ?: 0) / 100.0}"
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Seed assigned job (Cal.com slot)") }
            Button(
                onClick = {
                    val jid = jobId ?: return@Button
                    run {
                        val runDto = client.startChecklist(jid)
                        runId = runDto.runId
                        status = "Checklist ${runDto.checklistId} step ${runDto.stepIndex}"
                    }
                },
                enabled = jobId != null,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Start checklist") }
            Button(
                onClick = {
                    val rid = runId ?: return@Button
                    run {
                        val advanced = client.advanceChecklist(rid)
                        status = "Checklist ${advanced.status} · step ${advanced.stepIndex}"
                    }
                },
                enabled = runId != null,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Advance checklist step") }
            Button(
                onClick = {
                    val jid = jobId ?: return@Button
                    run {
                        client.uploadEvidence(jid, "photo", "data:image/jpeg;base64,pd9android")
                        status = "Evidence uploaded for $jid"
                    }
                },
                enabled = jobId != null,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Upload evidence photo") }
            Button(
                onClick = {
                    val jid = jobId ?: return@Button
                    run {
                        val mock =
                            client.checkIn(jid, -17.8292, 31.0522, isMockLocation = true)
                        val genuine =
                            client.checkIn(jid, -17.8292, 31.0522, isMockLocation = false)
                        status =
                            "Check-in mock blocked=${!mock.accepted} (${mock.reason}) · genuine ok=${genuine.accepted} punctuality=${genuine.punctualityEligible}"
                    }
                },
                enabled = jobId != null,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Check-in mock vs genuine GPS") }
            Button(
                onClick = {
                    val jid = jobId ?: return@Button
                    run {
                        val cam =
                            client.captureCameraEvidence(
                                jid,
                                "data:image/jpeg;base64,pd30camera",
                                "Photo of fault area (optional)",
                                queuedOffline = true,
                            )
                        val flushed = client.flushEvidenceQueue()
                        status =
                            "Camera ${cam.cameraSource} overlay=\"${cam.overlayChecklistStep}\" → ${cam.flushStatus} then flushed=$flushed · payableFromAi=${cam.payableFromAi}"
                    }
                },
                enabled = jobId != null,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Camera evidence + queue flush") }
            Button(
                onClick = {
                    run {
                        val th = client.takeHomePreview(10_000, hasItf263 = false)
                        status =
                            "Take-Home: net ${th.netPayoutMinor} · WHT ${th.withholdMinor} (${th.rateBps} bps) — D-50"
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Take-Home preview (30% WHT)") }
            Button(
                onClick = {
                    run {
                        val vs = client.fetchValueScore()
                        val factors =
                            vs.factorContributions.joinToString { "${it.factor}:${it.contribution}" }
                        status =
                            "Value Score ${vs.score} (${vs.confidence}) · $factors — not money"
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Value Score factors") }
            Button(
                onClick = {
                    run {
                        client.uploadItf263("fixture://itf263/android_pd25.pdf")
                        val verified = client.verifyItf263Fixture()
                        status = "ITF263 ${verified.status} · ${verified.documentRef}"
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Upload + verify ITF263") }
            Button(
                onClick = {
                    run {
                        val bd = client.takeHomeBreakdown(12_000, 2_000)
                        status =
                            "Take-Home gross ${bd.grossUsdMinor} → fee ${bd.dialFeeUsdMinor} → WHT ${bd.withholdMinor} → net ${bd.netPayoutMinor} · ITF=${bd.hasItf263} · payableFromAi=${bd.payableFromAi}"
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Take-Home breakdown") }
        }

        if (loading) CircularProgressIndicator()
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
    }
}
