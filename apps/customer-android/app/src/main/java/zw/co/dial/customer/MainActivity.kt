package zw.co.dial.customer

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import zw.co.dial.customer.ui.DialApp
import zw.co.dial.customer.ui.theme.DialTheme

/**
 * PD5 customer Android — Jetpack Compose (C-5; no Expo).
 * CoolMallKotlin = screen pattern donor only; ERP SoR = gateway APIs.
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            DialTheme {
                // Staging flavor without ops URL stays fail-closed (empty) — never invent a host.
                val baseUrl =
                    if (BuildConfig.DIAL_GATEWAY_URL_CONFIGURED) {
                        BuildConfig.DIAL_GATEWAY_BASE_URL
                    } else {
                        ""
                    }
                DialApp(baseUrl = baseUrl)
            }
        }
    }
}
