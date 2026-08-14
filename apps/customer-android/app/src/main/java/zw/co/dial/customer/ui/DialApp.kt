package zw.co.dial.customer.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import zw.co.dial.customer.network.DialGatewayClient
import zw.co.dial.customer.network.DialGatewayException
import zw.co.dial.customer.network.DialSession
import zw.co.dial.customer.network.MemoryCookieStore
import zw.co.dial.customer.network.SpareCheckoutResult
import zw.co.dial.customer.network.SpareOfferHit

private sealed interface Screen {
    data object SignIn : Screen

    data object Browse : Screen

    data class Cart(
        val offer: SpareOfferHit,
    ) : Screen

    data class Done(
        val result: SpareCheckoutResult,
    ) : Screen
}

@Composable
fun DialApp(baseUrl: String) {
    val cookies = remember { MemoryCookieStore() }
    val client = remember { DialGatewayClient(baseUrl, cookies) }
    var screen by remember { mutableStateOf<Screen>(Screen.SignIn) }
    var session by remember { mutableStateOf<DialSession?>(null) }

    when (val s = screen) {
        Screen.SignIn ->
            SignInScreen(
                onSignedIn = { sess ->
                    session = sess
                    screen = Screen.Browse
                },
                client = client,
            )
        Screen.Browse ->
            SpareBrowseScreen(
                session = session,
                client = client,
                onOpenCart = { offer -> screen = Screen.Cart(offer) },
                onSignOut = {
                    cookies.clear()
                    session = null
                    screen = Screen.SignIn
                },
            )
        is Screen.Cart ->
            SpareCartCheckoutScreen(
                offer = s.offer,
                client = client,
                onBack = { screen = Screen.Browse },
                onPaid = { result -> screen = Screen.Done(result) },
            )
        is Screen.Done ->
            CheckoutDoneScreen(
                result = s.result,
                onContinue = { screen = Screen.Browse },
            )
    }
}

@Composable
private fun SignInScreen(
    client: DialGatewayClient,
    onSignedIn: (DialSession) -> Unit,
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = "DIAL",
            style = MaterialTheme.typography.displayMedium,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = "Sign in to Shop — Spare (native Compose)",
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(top = 8.dp, bottom = 24.dp),
        )
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        error?.let {
            Text(
                text = it,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(top = 12.dp),
            )
        }
        Spacer(Modifier.height(20.dp))
        Button(
            onClick = {
                loading = true
                error = null
                scope.launch {
                    try {
                        val sess =
                            withContext(Dispatchers.IO) {
                                client.signIn(email.trim(), password)
                            }
                        onSignedIn(sess)
                    } catch (e: Exception) {
                        error = e.message ?: "Sign-in failed"
                    } finally {
                        loading = false
                    }
                }
            },
            enabled = !loading,
            modifier = Modifier.fillMaxWidth(),
        ) {
            if (loading) CircularProgressIndicator(modifier = Modifier.height(20.dp))
            else Text("Sign in")
        }
    }
}

@Composable
private fun SpareBrowseScreen(
    session: DialSession?,
    client: DialGatewayClient,
    onOpenCart: (SpareOfferHit) -> Unit,
    onSignOut: () -> Unit,
) {
    var query by remember { mutableStateOf("") }
    var hits by remember { mutableStateOf<List<SpareOfferHit>>(emptyList()) }
    var currency by remember { mutableStateOf("USD") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    fun load(q: String) {
        loading = true
        error = null
        scope.launch {
            try {
                val result =
                    withContext(Dispatchers.IO) {
                        client.searchSpare(q)
                    }
                hits = result.hits
                currency = result.currency
                if (currency != "USD") {
                    error = "Browse currency must be USD (D-57); got $currency"
                }
            } catch (e: Exception) {
                error = e.message ?: "Search failed"
                hits = emptyList()
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) { load("") }

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(16.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(
                    text = "Dial a Spare",
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "${session?.email ?: ""} · $currency browse",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            TextButton(onClick = onSignOut) { Text("Sign out") }
        }
        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                label = { Text("Search parts") },
                singleLine = true,
                modifier = Modifier.weight(1f),
            )
            Button(onClick = { load(query) }) { Text("Go") }
        }
        error?.let {
            Text(text = it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp))
        }
        if (loading) {
            CircularProgressIndicator(modifier = Modifier.padding(24.dp).align(Alignment.CenterHorizontally))
        } else {
            LazyColumn(
                contentPadding = PaddingValues(vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(hits, key = { it.offerId }) { offer ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(Modifier = Modifier.padding(16.dp)) {
                            Text(offer.title, fontWeight = FontWeight.SemiBold)
                            Text(
                                "${offer.brand} · ${offer.qualityTier} · ${offer.supplierFormality}",
                                style = MaterialTheme.typography.bodySmall,
                            )
                            Text(
                                "USD ${"%.2f".format(offer.unitPriceUsdMinor / 100.0)}",
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(top = 8.dp),
                            )
                            Button(
                                onClick = { onOpenCart(offer) },
                                modifier = Modifier.padding(top = 8.dp),
                            ) {
                                Text("Add · Checkout")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SpareCartCheckoutScreen(
    offer: SpareOfferHit,
    client: DialGatewayClient,
    onBack: () -> Unit,
    onPaid: (SpareCheckoutResult) -> Unit,
) {
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    fun pay(choice: String) {
        loading = true
        error = null
        scope.launch {
            try {
                val result =
                    withContext(Dispatchers.IO) {
                        client.checkoutSpare(offer.offerId, choice)
                    }
                onPaid(result)
            } catch (e: DialGatewayException) {
                error = e.message
            } catch (e: Exception) {
                error = e.message ?: "Checkout failed"
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
                .padding(24.dp),
    ) {
        TextButton(onClick = onBack) { Text("← Browse") }
        Text(
            text = "Cart (USD)",
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
        )
        Spacer(Modifier.height(16.dp))
        Text(offer.title, fontWeight = FontWeight.SemiBold)
        Text("USD ${"%.2f".format(offer.unitPriceUsdMinor / 100.0)} · qty 1")
        Text(
            "ZiG conversion only at pay (D-57). IMTT not on lines.",
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.padding(top = 12.dp),
        )
        error?.let {
            Text(text = it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 12.dp))
        }
        Spacer(Modifier.height(24.dp))
        Button(
            onClick = { pay("ecocash") },
            enabled = !loading,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Pay EcoCash")
        }
        Spacer(Modifier.height(12.dp))
        OutlinedButton(
            onClick = { pay("cod") },
            enabled = !loading,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Cash on delivery (USD)")
        }
    }
}

@Composable
private fun CheckoutDoneScreen(
    result: SpareCheckoutResult,
    onContinue: () -> Unit,
) {
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            "Order placed",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
        )
        Text("${result.choice} · ${result.currency} ${result.cartTotalUsdMinor / 100.0}")
        result.soldBy?.let { Text(it, modifier = Modifier.padding(top = 8.dp)) }
        result.fxRateId?.let { Text("fx_rate_id=$it", style = MaterialTheme.typography.bodySmall) }
        Button(onClick = onContinue, modifier = Modifier.padding(top = 24.dp).fillMaxWidth()) {
            Text("Back to Spare")
        }
    }
}
