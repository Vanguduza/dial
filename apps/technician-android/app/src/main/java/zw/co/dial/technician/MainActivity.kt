package zw.co.dial.technician

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import zw.co.dial.technician.ui.TechnicianApp
import zw.co.dial.technician.ui.theme.DialTechnicianTheme

/** PD9 technician-android — Jetpack Compose (C-5). Now in Android patterns. */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            DialTechnicianTheme {
                TechnicianApp(baseUrl = BuildConfig.DIAL_GATEWAY_BASE_URL)
            }
        }
    }
}
