package zw.co.dial.delivery.maps

/**
 * GTR blank-map prevention — ported from Nissan GTR delivery MapLibreJobMap.
 * textureMode(true) is required at MapView construction (Compose).
 */
object MapLayoutDecisions {
    const val STALL_RETRY_MS = 2500L
    const val RESUME_GL_REBIND_DELAY_MS = 120L
    const val OPENFREEMAP_LIBERTY = "https://tiles.openfreemap.org/styles/liberty"

    @JvmStatic
    fun shouldWaitForMapLayout(width: Int, height: Int, attempt: Int, maxAttempts: Int = 24): Boolean {
        if (attempt >= maxAttempts) return false
        return width <= 0 || height <= 0
    }

    @JvmStatic
    fun resumeShouldReloadStyle(styleIsNull: Boolean): Boolean = styleIsNull

    @JvmStatic
    fun resolveStyleUrl(url: String?): String {
        val value = url?.trim().orEmpty()
        if (value.isEmpty()) return OPENFREEMAP_LIBERTY
        return try {
            val host = java.net.URI(value).host ?: return OPENFREEMAP_LIBERTY
            val loopback = host == "localhost" || host == "127.0.0.1" || host == "0.0.0.0" || host == "::1"
            val rfc1918 = host.startsWith("10.") || host.startsWith("192.168.") ||
                Regex("^172\\.(1[6-9]|2\\d|3[0-1])\\.").containsMatchIn(host)
            if (loopback || rfc1918) OPENFREEMAP_LIBERTY else value
        } catch (_: Exception) {
            OPENFREEMAP_LIBERTY
        }
    }
}
