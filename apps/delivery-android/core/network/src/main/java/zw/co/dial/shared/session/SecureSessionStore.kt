package zw.co.dial.shared.session

/**
 * Secure session persistence contract. Production uses EncryptedSharedPreferences;
 * tests use in-memory. Empty gateway URL is an explicit error, not silent.
 */
class SecureSessionStore {
    private var token: String? = null

    fun saveToken(value: String) {
        token = value
    }

    fun loadToken(): String? = token

    fun clear() {
        token = null
    }

    companion object {
        @JvmStatic
        fun misconfiguredGateway(baseUrl: String, configured: Boolean): String? {
            if (!configured || baseUrl.isBlank()) return "Gateway URL is not configured"
            return null
        }
    }
}
