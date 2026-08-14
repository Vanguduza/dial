package zw.co.dial.delivery

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import zw.co.dial.delivery.ui.DeliveryApp
import zw.co.dial.delivery.ui.theme.DialDeliveryTheme

/** PD7 delivery-android — Jetpack Compose (C-5). foodhub-compose = pattern only. */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            DialDeliveryTheme {
                DeliveryApp(baseUrl = BuildConfig.DIAL_GATEWAY_BASE_URL)
            }
        }
    }
}
