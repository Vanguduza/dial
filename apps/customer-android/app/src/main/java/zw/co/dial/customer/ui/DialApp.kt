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
import zw.co.dial.customer.network.GarageVehicle
import zw.co.dial.customer.network.GroceryOfferHit
import zw.co.dial.customer.network.MemoryCookieStore
import zw.co.dial.customer.network.SpareCheckoutResult
import zw.co.dial.customer.network.SpareOfferHit
import zw.co.dial.customer.network.SpareOrderSummary
import zw.co.dial.customer.network.SpareReturnClaim

private sealed interface Screen {
    data object SignIn : Screen

    data object Browse : Screen

    data object Orders : Screen

    data object Garage : Screen

    data object Grocery : Screen

    data class Cart(
        val offer: SpareOfferHit,
    ) : Screen

    data class GroceryCart(
        val offer: GroceryOfferHit,
    ) : Screen

    data class Done(
        val result: SpareCheckoutResult,
        val orderId: String? = null,
        val claimId: String? = null,
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
                onOrders = { screen = Screen.Orders },
                onGarage = { screen = Screen.Garage },
                onGrocery = { screen = Screen.Grocery },
                onSignOut = {
                    cookies.clear()
                    session = null
                    screen = Screen.SignIn
                },
            )
        Screen.Orders ->
            OrdersScreen(
                session = session,
                client = client,
                onBack = { screen = Screen.Browse },
            )
        Screen.Garage ->
            GarageScreen(
                session = session,
                client = client,
                onBack = { screen = Screen.Browse },
            )
        Screen.Grocery ->
            GroceryBrowseScreen(
                client = client,
                onOpenCart = { offer -> screen = Screen.GroceryCart(offer) },
                onBack = { screen = Screen.Browse },
            )
        is Screen.Cart ->
            SpareCartCheckoutScreen(
                offer = s.offer,
                session = session,
                client = client,
                onBack = { screen = Screen.Browse },
                onPaid = { result, orderId, claimId ->
                    screen = Screen.Done(result, orderId, claimId)
                },
            )
        is Screen.GroceryCart ->
            GroceryCheckoutScreen(
                offer = s.offer,
                client = client,
                onBack = { screen = Screen.Grocery },
                onPaid = { screen = Screen.Browse },
            )
        is Screen.Done ->
            CheckoutDoneScreen(
                result = s.result,
                orderId = s.orderId,
                claimId = s.claimId,
                onContinue = { screen = Screen.Browse },
                onOrders = { screen = Screen.Orders },
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
            text = "Sign in — Spare + Grocery (native Compose · PD20)",
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
        Spacer(modifier.height(12.dp))
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
        Spacer(modifier.height(20.dp))
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
    onOrders: () -> Unit,
    onGarage: () -> Unit,
    onGrocery: () -> Unit,
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
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            TextButton(onClick = onOrders) { Text("Orders") }
            TextButton(onClick = onGarage) { Text("Garage") }
            TextButton(onClick = onGrocery) { Text("Grocery") }
        }
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
    session: DialSession?,
    client: DialGatewayClient,
    onBack: () -> Unit,
    onPaid: (SpareCheckoutResult, String?, String?) -> Unit,
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
                        val checkout = client.checkoutSpare(offer.offerId, choice)
                        var orderId: String? = null
                        var claimId: String? = null
                        val cartId = checkout.cartId
                        if (!cartId.isNullOrBlank()) {
                            val order =
                                client.placeSpareOrder(
                                    cartId,
                                    choice,
                                    session?.userId,
                                )
                            orderId = order.orderId
                            client.trackSpareOrder(order.orderId)
                            val claim = client.openSpareReturn(order.orderId)
                            claimId = claim.claimId
                            require(!claim.payableFromAi) { "returns must forbid AI payable" }
                        }
                        Triple(checkout, orderId, claimId)
                    }
                onPaid(result.first, result.second, result.third)
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
        Spacer(modifier.height(16.dp))
        Text(offer.title, fontWeight = FontWeight.SemiBold)
        Text("USD ${"%.2f".format(offer.unitPriceUsdMinor / 100.0)} · qty 1")
        Text(
            "ZiG conversion only at pay (D-57). IMTT not on lines. Then ERP order + return stub.",
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
    orderId: String?,
    claimId: String?,
    onContinue: () -> Unit,
    onOrders: () -> Unit,
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
        orderId?.let { Text("ERP order $it", style = MaterialTheme.typography.bodySmall) }
        claimId?.let { Text("Return claim $it (payableFromAi=false)", style = MaterialTheme.typography.bodySmall) }
        result.fxRateId?.let { Text("fx_rate_id=$it", style = MaterialTheme.typography.bodySmall) }
        Button(onClick = onOrders, modifier = Modifier.padding(top = 24.dp).fillMaxWidth()) {
            Text("View orders")
        }
        OutlinedButton(onClick = onContinue, modifier = Modifier.padding(top = 8.dp).fillMaxWidth()) {
            Text("Back to Spare")
        }
    }
}

@Composable
private fun OrdersScreen(
    session: DialSession?,
    client: DialGatewayClient,
    onBack: () -> Unit,
) {
    var orders by remember { mutableStateOf<List<SpareOrderSummary>>(emptyList()) }
    var lastClaim by remember { mutableStateOf<SpareReturnClaim?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    fun reload() {
        loading = true
        error = null
        scope.launch {
            try {
                orders =
                    withContext(Dispatchers.IO) {
                        client.listSpareOrders(session?.userId)
                    }
            } catch (e: Exception) {
                error = e.message
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) { reload() }

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(16.dp),
    ) {
        TextButton(onClick = onBack) { Text("← Spare") }
        Text(
            "Orders (USD)",
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
        )
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        lastClaim?.let {
            Text("Opened return ${it.claimId} · AI payable=${it.payableFromAi}", style = MaterialTheme.typography.bodySmall)
        }
        if (loading) {
            CircularProgressIndicator(modifier = Modifier.padding(24.dp))
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(orders, key = { it.orderId }) { o ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(Modifier = Modifier.padding(12.dp)) {
                            Text(o.orderId, fontWeight = FontWeight.SemiBold)
                            Text("${o.status} · Sold by ${o.soldBySummary}")
                            Text("USD ${"%.2f".format(o.totalUsdMinor / 100.0)} · ${o.payChoice}")
                            TextButton(
                                onClick = {
                                    scope.launch {
                                        try {
                                            withContext(Dispatchers.IO) {
                                                client.trackSpareOrder(o.orderId)
                                            }
                                            lastClaim =
                                                withContext(Dispatchers.IO) {
                                                    client.openSpareReturn(o.orderId)
                                                }
                                        } catch (e: Exception) {
                                            error = e.message
                                        }
                                    }
                                },
                            ) {
                                Text("Track + open return")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun GarageScreen(
    session: DialSession?,
    client: DialGatewayClient,
    onBack: () -> Unit,
) {
    var vehicles by remember { mutableStateOf<List<GarageVehicle>>(emptyList()) }
    var label by remember { mutableStateOf("") }
    var chassis by remember { mutableStateOf("") }
    var consent by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val customerId = session?.userId.orEmpty()

    fun reload() {
        if (customerId.isBlank()) return
        scope.launch {
            try {
                vehicles =
                    withContext(Dispatchers.IO) {
                        client.listGarageVehicles(customerId)
                    }
            } catch (e: Exception) {
                error = e.message
            }
        }
    }

    LaunchedEffect(customerId) { reload() }

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(16.dp),
    ) {
        TextButton(onClick = onBack) { Text("← Spare") }
        Text(
            "Garage",
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
        )
        Text("Reminders require consent (Pack §9.2).", style = MaterialTheme.typography.bodySmall)
        OutlinedTextField(
            value = label,
            onValueChange = { label = it },
            label = { Text("Vehicle label") },
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        )
        OutlinedTextField(
            value = chassis,
            onValueChange = { chassis = it },
            label = { Text("Chassis hint") },
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        )
        TextButton(onClick = { consent = !consent }) {
            Text(if (consent) "Reminder consent: ON" else "Reminder consent: OFF")
        }
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Button(
            onClick = {
                scope.launch {
                    try {
                        withContext(Dispatchers.IO) {
                            client.addGarageVehicle(customerId, label, chassis, consent)
                        }
                        label = ""
                        chassis = ""
                        reload()
                    } catch (e: Exception) {
                        error = e.message
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Add vehicle")
        }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 12.dp)) {
            items(vehicles, key = { it.vehicleId }) { v ->
                Text("${v.label} · ${v.chassisHint} · consent=${v.reminderConsent}")
            }
        }
    }
}

@Composable
private fun GroceryBrowseScreen(
    client: DialGatewayClient,
    onOpenCart: (GroceryOfferHit) -> Unit,
    onBack: () -> Unit,
) {
    var hits by remember { mutableStateOf<List<GroceryOfferHit>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        try {
            val result =
                withContext(Dispatchers.IO) {
                    client.searchGrocery("")
                }
            if (result.currency != "USD") error = "Grocery must be USD"
            if (result.liquorSkus) error = "Liquor must not appear"
            hits = result.hits
        } catch (e: Exception) {
            error = e.message
        } finally {
            loading = false
        }
    }

    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(16.dp),
    ) {
        TextButton(onClick = onBack) { Text("← Spare") }
        Text(
            "Grocery (USD · food)",
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
        )
        Text("No liquor · EcoCash | COD", style = MaterialTheme.typography.bodySmall)
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        if (loading) {
            CircularProgressIndicator(modifier = Modifier.padding(24.dp))
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(hits, key = { it.offerId }) { offer ->
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Column(Modifier = Modifier.padding(12.dp)) {
                            Text(offer.title, fontWeight = FontWeight.SemiBold)
                            Text("${offer.brand} · ${offer.unitLabel}")
                            Text("USD ${"%.2f".format(offer.unitPriceUsdMinor / 100.0)}")
                            Button(onClick = { onOpenCart(offer) }) { Text("Checkout") }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun GroceryCheckoutScreen(
    offer: GroceryOfferHit,
    client: DialGatewayClient,
    onBack: () -> Unit,
    onPaid: () -> Unit,
) {
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    fun pay(choice: String) {
        loading = true
        scope.launch {
            try {
                withContext(Dispatchers.IO) {
                    client.checkoutGrocery(offer.offerId, choice)
                }
                onPaid()
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
                .padding(24.dp)
                .background(MaterialTheme.colorScheme.background),
    ) {
        TextButton(onClick = onBack) { Text("← Grocery") }
        Text(offer.title, fontWeight = FontWeight.Bold)
        Text("USD ${"%.2f".format(offer.unitPriceUsdMinor / 100.0)}")
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Button(onClick = { pay("ecocash") }, enabled = !loading, modifier = Modifier.fillMaxWidth().padding(top = 16.dp)) {
            Text("Pay EcoCash")
        }
        OutlinedButton(onClick = { pay("cod") }, enabled = !loading, modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) {
            Text("Cash on delivery (USD)")
        }
    }
}
