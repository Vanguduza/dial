package zw.co.dial.delivery.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DialPrimary = Color(0xFF0B3D2E)
private val DialAccent = Color(0xFFC4A35A)
private val DialSurface = Color(0xFFF7F4EF)
private val DialInk = Color(0xFF14201B)

@Composable
fun DialDeliveryTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme =
            lightColorScheme(
                primary = DialPrimary,
                secondary = DialAccent,
                background = DialSurface,
                surface = DialSurface,
                onPrimary = Color.White,
                onBackground = DialInk,
                onSurface = DialInk,
            ),
        content = content,
    )
}
