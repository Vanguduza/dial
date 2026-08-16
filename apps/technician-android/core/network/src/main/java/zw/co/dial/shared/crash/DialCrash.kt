package zw.co.dial.shared.crash

object DialCrash {
    @JvmStatic
    fun capture(throwable: Throwable) {
        val dsn = System.getenv("DIAL_CRASH_DSN")?.trim().orEmpty()
        if (dsn.isEmpty()) return
        throwable.printStackTrace()
    }
}
