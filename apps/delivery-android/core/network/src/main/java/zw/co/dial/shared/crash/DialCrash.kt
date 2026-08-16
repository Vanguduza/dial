package zw.co.dial.shared.crash

/**
 * Crash sink — no-op until DSN is dropped in (key-drop-in).
 * Never logs tokens. Env: DIAL_CRASH_DSN (vault).
 */
object DialCrash {
    @JvmStatic
    fun capture(throwable: Throwable) {
        val dsn = System.getenv("DIAL_CRASH_DSN")?.trim().orEmpty()
        if (dsn.isEmpty()) return
        throwable.printStackTrace()
    }

    @JvmStatic
    fun isConfigured(): Boolean = !System.getenv("DIAL_CRASH_DSN")?.trim().isNullOrEmpty()
}
