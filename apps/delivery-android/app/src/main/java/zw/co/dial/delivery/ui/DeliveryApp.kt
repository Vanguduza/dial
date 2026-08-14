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
import androidx.compose.ui.Modifier.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import zw.co.dial.delivery.network.DialDeliveryClient
import zw.co.dial.delivery.network.MemoryCookieStore

/**
 * Pack §9.8 thin UI: offer Accept|Reject → transit → location → POD → COD.
 * MapLibre track is admin web; this app posts courier_locations for that SoR.
 */
@Composable
fun DeliveryApp(baseUrl: String) {
    val cookies = remember { MemoryCookieStore() }
    val client = remember { DialDeliveryClient(baseUrl, cookies) }
    var signedIn by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var offerId by remember { mutableStateOf<String?>(null) }
    var jobId by remember { mutableStateOf<String?>(null) }
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
        Text("Compose rider · packages/delivery SoR · MapLibre via admin track", style = MaterialTheme.typography.bodySmall)

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
            Text(status, style = MaterialTheme.typography.bodyMedium)
            Button(
                onClick = {
                    run {
                        client.setAvailability("available")
                        status = "Available for offers"
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Go available") }
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
                        client.postLocation(-17.8292, 31.0522, jid)
                        status = "In transit · location posted (MapLibre track)"
                    }
                },
                enabled = jobId != null,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Start run + post location") }
            Button(
                onClick = {
                    val jid = jobId ?: return@Button
                    run {
                        client.capturePod(jid)
                        val cod = client.reconcileCod(jid)
                        status =
                            "POD captured · COD USD ${(cod.amountUsdMinor ?: 0) / 100.0} reconciled=${cod.reconciled}"
                    }
                },
                enabled = jobId != null,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Capture POD + COD") }
        }

        if (loading) {
            CircularProgressIndicator()
        }
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Spacer(Modifier.height(8.dp))
        Text("PD7 · no Expo · not Fleetbase · COD amountMinor USD", style = MaterialTheme.typography.labelSmall)
    }
}
