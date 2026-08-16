package zw.co.dial.delivery.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import zw.co.dial.delivery.network.DialDeliveryClient
import zw.co.dial.delivery.location.CourierLocationPipeline
import zw.co.dial.delivery.maps.MapLayoutDecisions
import zw.co.dial.shared.session.SecureSessionStore

/**
 * Pack §9.8 thin UI: offer Accept|Reject → transit → ETA/stops/VROOM → POD → COD.
 * MapLibre track is admin web; this app posts courier_locations for that SoR.
 */
@Composable
fun DeliveryApp(baseUrl: String) {
    val gatewayError = SecureSessionStore.misconfiguredGateway(baseUrl, baseUrl.isNotBlank())
    val cookies = remember { MemoryCookieStore() }
    val client = remember { DialDeliveryClient(baseUrl, cookies) }
    var signedIn by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var offerId by remember { mutableStateOf<String?>(null) }
    var jobId by remember { mutableStateOf<String?>(null) }
    var etaBanner by remember { mutableStateOf("ETA — start run") }
    var stopList by remember { mutableStateOf("Stops — start run") }
    var status by remember { mutableStateOf("Go available, then seed/accept offer.") }
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
            "DIAL Delivery",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
        )
        Text(
            "Compose · ETA · navigate stops · VROOM · MapLibre/OSRM",
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
                        status = "Signed in — set available"
                    }
                },
                enabled = !loading,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Sign in")
            }
        } else {
            Text(
                etaBanner,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.primary,
            )
            Text(stopList, style = MaterialTheme.typography.bodySmall)
            Text(status, style = MaterialTheme.typography.bodyMedium)
            // PD51 — COD float banner surface (ops gate before collect)
            if (status.contains("floatWarn=true") || status.contains("FLOAT_BANNER")) {
                Text(
                    "COD float limit warning — ack before collect",
                    color = MaterialTheme.colorScheme.error,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            Button(
                onClick = {
                    run {
                        client.setAvailability("available")
                        status = "Available for offers"
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Go available") }
            OutlinedButton(
                onClick = {
                    run {
                        client.setAvailability("busy")
                        status = "Busy — ineligible for new offers"
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Set busy") }
            OutlinedButton(
                onClick = {
                    run {
                        client.setAvailability("offline")
                        status = "Offline — ineligible for offers"
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Go offline") }
            Button(
                onClick = {
                    run {
                        val packs = client.listOfflinePacks()
                        client.activateOfflinePack("harare_metro")
                        client.activateOfflinePack("bulawayo_metro")
                        status =
                            "Offline packs: ${packs.joinToString { it.city }} · MapLibre installed"
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Install Harare + Bulawayo offline packs") }
            Button(
                onClick = {
                    run {
                        val (oid, jid) = client.seedOffer(2500)
                        offerId = oid
                        jobId = jid
                        status = "Offer $oid for job $jid"
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Seed offer (fixture)") }
            Button(
                onClick = {
                    val oid = offerId ?: return@Button
                    run {
                        client.acceptOffer(oid)
                        status = "Accepted — start transit"
                    }
                },
                enabled = offerId != null,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Accept offer") }
            OutlinedButton(
                onClick = {
                    val oid = offerId ?: return@OutlinedButton
                    run {
                        client.rejectOffer(oid)
                        status = "Rejected — workflow reassigns/FIFO"
                        offerId = null
                    }
                },
                enabled = offerId != null,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Reject offer") }
            Button(
                onClick = {
                    val jid = jobId ?: return@Button
                    run {
                        client.startTransit(jid)
                        val pipeline = CourierLocationPipeline { lat, lng ->
                            client.postLocation(lat, lng, jid)
                        }
                        pipeline.onFix(-17.8292, 31.0522)
                        val waitLayout = MapLayoutDecisions.shouldWaitForMapLayout(0, 0, 0)
                        val eta = client.getEtaBanner(jid)
                        val stops = client.listNavigateStops(jid)
                        etaBanner =
                            "ETA ${eta.etaMinutes} min · ${eta.nextStopLabel} · ${eta.provider}"
                        stopList =
                            stops
                                .sortedBy { it.sequence }
                                .joinToString(" → ") { "${it.sequence}. ${it.label}" }
                        status = "In transit · layoutWait=$waitLayout · OSRM ETA + MapLibre SoR"
                    }
                },
                enabled = jobId != null,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Start run + ETA + stops") }
            Button(
                onClick = {
                    val jid = jobId ?: return@Button
                    run {
                        val opt = client.reoptimiseStops(jid)
                        etaBanner =
                            "ETA ${opt.etaMinutes} min after VROOM · ${opt.provider}"
                        stopList =
                            opt.stopLabels
                                .mapIndexed { i, l -> "${i + 1}. $l" }
                                .joinToString(" → ")
                        status =
                            if (opt.orderChanged) {
                                "Re-optimised remaining stops (VROOM) · MapLibre/OSRM"
                            } else {
                                "Re-optimise requested · order unchanged"
                            }
                    }
                },
                enabled = jobId != null,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Request VROOM re-optimise") }
            Button(
                onClick = {
                    val jid = jobId ?: return@Button
                    run {
                        client.capturePod(jid, photoRef = "fixture://pod/$jid.jpg")
                        val cod = client.reconcileCod(jid)
                        client.setCodFloatLimit(5000)
                        val eval = client.evaluateCodFloat(cod.amountUsdMinor ?: 2500)
                        if (eval.floatLimitWarning) {
                            status =
                                "FLOAT_BANNER · ${eval.message} · ack required before COD"
                        } else {
                            val attempt =
                                client.codCollectAttempt(
                                    jid,
                                    cod.amountUsdMinor ?: 2500,
                                    acknowledgedWarning = false,
                                )
                            status =
                                "POD+photo+COD ${(cod.amountUsdMinor ?: 0) / 100.0} · floatWarn=false · attempt=${attempt.status}"
                        }
                    }
                },
                enabled = jobId != null,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Capture POD + photo (float check)") }
            Button(
                onClick = {
                    val jid = jobId ?: return@Button
                    run {
                        val cod = client.reconcileCod(jid)
                        val attempt =
                            client.codCollectAttempt(
                                jid,
                                cod.amountUsdMinor ?: 2500,
                                acknowledgedWarning = true,
                            )
                        status =
                            "COD acked · floatWarn=${attempt.floatLimitWarning} · attempt=${attempt.status}"
                    }
                },
                enabled = jobId != null,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Ack float + COD collect") }
        }

        if (gatewayError != null) {
            Text(gatewayError, color = MaterialTheme.colorScheme.error)
        }
        if (loading) {
            CircularProgressIndicator()
        }
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Spacer(modifier.height(8.dp))
        Text(
            "PD51 · POD photo · COD float banner ack · MapLibre · not Google",
            style = MaterialTheme.typography.labelSmall,
        )
    }
}
