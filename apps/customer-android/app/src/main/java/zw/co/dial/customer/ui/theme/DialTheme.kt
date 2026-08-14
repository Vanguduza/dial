package zw.co.dial.customer.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

/** Dial brand tokens (packages/design-tokens) — CoolMall-style storefront shell, Dial palette. */
private val DialPrimary = Color(0xFF0B3D2E)
private val DialAccent = Color(0xFFC4A35A)
private val DialSurface = Color(0xFFF7F4EF)
private val DialInk = Color(0xFF14201B)

private val DialColors =
    lightColorScheme(
        primary = DialPrimary,
        secondary = DialAccent,
        background = DialSurface,
        surface = DialSurface,
        onPrimary = Color.White,
        onSecondary = DialInk,
        onBackground = DialInk,
        onSurface = DialInk,
    )

@Composable
fun DialTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = DialColors, content = content)
}
