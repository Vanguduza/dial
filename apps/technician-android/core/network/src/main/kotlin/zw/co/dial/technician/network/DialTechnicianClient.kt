package zw.co.dial.technician.network

/**
 * PD9 technician gateway client — @dial/jobs SoR via /api/tech/technician.
 * Session = dial_session cookie; never send userId/role in body (D-47).
 */
data class TechJobDto(
    val id: String,
    val status: String,
    val jobClassId: String,
    val draftAmountUsdMinor: Long?,
)

data class ChecklistRunDto(
    val runId: String,
    val checklistId: String,
    val stepIndex: Int,
    val status: String,
)

data class TakeHomePreview(
    val netPayoutMinor: Long,
    val withholdMinor: Long,
    val rateBps: Int,
)

class DialTechnicianException(message: String, val statusCode: Int = 0) : Exception(message)

interface CookieStore {
    fun getCookieHeader(): String?

    fun storeFromSetCookie(headers: List<String>)
}

class MemoryCookieStore : CookieStore {
    private var cookie: String? = null

    override fun getCookieHeader(): String? = cookie

    override fun storeFromSetCookie(headers: List<String>) {
        for (raw in headers) {
            val part = raw.substringBefore(';').trim()
            if (part.startsWith("dial_session=")) {
                cookie = part
                return
            }
        }
    }

    fun clear() {
        cookie = null
    }
}

data class HttpResponse(
    val statusCode: Int,
    val body: String,
    val setCookieHeaders: List<String>,
)

fun interface HttpTransport {
    fun request(
        method: String,
        url: String,
        headers: Map<String, String>,
        body: String?,
        cookieHeader: String?,
    ): HttpResponse
}

class UrlConnectionTransport : HttpTransport {
    override fun request(
        method: String,
        url: String,
        headers: Map<String, String>,
        body: String?,
        cookieHeader: String?,
    ): HttpResponse {
        val conn = java.net.URI(url).toURL().openConnection() as java.net.HttpURLConnection
        conn.requestMethod = method
        conn.connectTimeout = 15_000
        conn.readTimeout = 15_000
        conn.doInput = true
        headers.forEach { (k, v) -> conn.setRequestProperty(k, v) }
        if (!cookieHeader.isNullOrBlank()) {
            conn.setRequestProperty("Cookie", cookieHeader)
        }
        if (body != null) {
            conn.doOutput = true
            conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        }
        val code = conn.responseCode
        val stream = if (code in 200..299) conn.inputStream else conn.errorStream
        val text = stream?.bufferedReader()?.readText().orEmpty()
        val setCookies = conn.headerFields["Set-Cookie"].orEmpty()
        conn.disconnect()
        return HttpResponse(code, text, setCookies)
    }
}

class DialTechnicianClient(
    private val baseUrl: String,
    private val cookies: CookieStore = MemoryCookieStore(),
    private val transport: HttpTransport = UrlConnectionTransport(),
) {
    fun signIn(email: String, password: String) {
        val body =
            """{"email":${jsonString(email)},"password":${jsonString(password)}}"""
        val res =
            transport.request(
                "POST",
                "$baseUrl/api/auth/sign-in",
                mapOf("Content-Type" to "application/json", "Accept" to "application/json"),
                body,
                cookies.getCookieHeader(),
            )
        cookies.storeFromSetCookie(res.setCookieHeaders)
        if (res.statusCode !in 200..299) {
            throw DialTechnicianException(parseError(res.body) ?: "sign-in failed", res.statusCode)
        }
    }

    fun listJobs(): List<TechJobDto> {
        val res = get("/api/tech/technician")
        return parseJobs(res.body)
    }

    fun seedAssignedJob(): TechJobDto {
        val body = postAction("""{"action":"seed_assigned_job"}""")
        return parseJobObject(body) ?: throw DialTechnicianException("seed missing job")
    }

    fun startChecklist(jobId: String, checklistId: String = "automotive_basic"): ChecklistRunDto {
        val body =
            postAction(
                """{"action":"start_checklist","jobId":${jsonString(jobId)},"checklistId":${jsonString(checklistId)}}""",
            )
        return parseRun(body) ?: throw DialTechnicianException("start_checklist missing run")
    }

    fun advanceChecklist(runId: String): ChecklistRunDto {
        val body = postAction("""{"action":"advance_checklist","runId":${jsonString(runId)}}""")
        return parseRun(body) ?: throw DialTechnicianException("advance missing run")
    }

    fun uploadEvidence(jobId: String, kind: String, payloadRef: String) {
        require(kind == "photo" || kind == "note")
        postAction(
            """{"action":"upload_evidence","jobId":${jsonString(jobId)},"kind":${jsonString(kind)},"payloadRef":${jsonString(payloadRef)}}""",
        )
    }

    fun takeHomePreview(payoutUsdMinor: Long, hasItf263: Boolean): TakeHomePreview {
        val body =
            postAction(
                """{"action":"take_home_preview","payoutUsdMinor":${jsonString(payoutUsdMinor.toString())},"hasItf263":$hasItf263}""",
            )
        val net =
            Regex(""""netPayoutMinor"\s*:\s*"?(\d+)"?""")
                .find(body)
                ?.groupValues
                ?.get(1)
                ?.toLongOrNull() ?: 0L
        val withhold =
            Regex(""""withholdMinor"\s*:\s*"?(\d+)"?""")
                .find(body)
                ?.groupValues
                ?.get(1)
                ?.toLongOrNull() ?: 0L
        val rate =
            Regex(""""rateBps"\s*:\s*(\d+)""")
                .find(body)
                ?.groupValues
                ?.get(1)
                ?.toIntOrNull() ?: 0
        return TakeHomePreview(net, withhold, rate)
    }

    private fun get(path: String): HttpResponse {
        val res =
            transport.request(
                "GET",
                "$baseUrl$path",
                mapOf("Accept" to "application/json"),
                null,
                cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialTechnicianException(parseError(res.body) ?: "GET failed", res.statusCode)
        }
        return res
    }

    private fun postAction(jsonBody: String): String {
        // D-47: never send userId/role in body.
        require(!jsonBody.contains("userId") && !jsonBody.contains("\"role\"")) {
            "identity fields forbidden in body (D-47)"
        }
        val res =
            transport.request(
                "POST",
                "$baseUrl/api/tech/technician",
                mapOf("Content-Type" to "application/json", "Accept" to "application/json"),
                jsonBody,
                cookies.getCookieHeader(),
            )
        if (res.statusCode !in 200..299) {
            throw DialTechnicianException(parseError(res.body) ?: "action failed", res.statusCode)
        }
        return res.body
    }
}

internal fun jsonString(value: String): String =
    buildString {
        append('"')
        for (c in value) {
            when (c) {
                '\\' -> append("\\\\")
                '"' -> append("\\\"")
                else -> append(c)
            }
        }
        append('"')
    }

internal fun parseError(body: String): String? =
    Regex(""""error"\s*:\s*"([^"]+)"""").find(body)?.groupValues?.get(1)

internal fun parseJobs(body: String): List<TechJobDto> {
    val block =
        Regex(""""jobs"\s*:\s*\[(.*?)]""", RegexOption.DOT_MATCHES_ALL)
            .find(body)
            ?.groupValues
            ?.get(1)
            .orEmpty()
    return Regex("""\{[^{}]*"id"\s*:\s*"([^"]+)"[^{}]*\}""")
        .findAll(block)
        .map { parseJobChunk(it.value) }
        .toList()
}

internal fun parseJobObject(body: String): TechJobDto? {
    val chunk =
        Regex(""""job"\s*:\s*(\{[^{}]*\})""")
            .find(body)
            ?.groupValues
            ?.get(1) ?: return null
    return parseJobChunk(chunk)
}

internal fun parseJobChunk(chunk: String): TechJobDto {
    fun f(n: String) = Regex(""""$n"\s*:\s*"([^"]*)"""").find(chunk)?.groupValues?.get(1).orEmpty()
    val amount =
        Regex(""""draftAmountUsdMinor"\s*:\s*"?(\d+)"?""")
            .find(chunk)
            ?.groupValues
            ?.get(1)
            ?.toLongOrNull()
    return TechJobDto(
        id = f("id"),
        status = f("status"),
        jobClassId = f("jobClassId"),
        draftAmountUsdMinor = amount,
    )
}

internal fun parseRun(body: String): ChecklistRunDto? {
    val chunk =
        Regex(""""run"\s*:\s*(\{[^{}]*\})""")
            .find(body)
            ?.groupValues
            ?.get(1) ?: return null
    fun f(n: String) = Regex(""""$n"\s*:\s*"([^"]*)"""").find(chunk)?.groupValues?.get(1).orEmpty()
    val step =
        Regex(""""stepIndex"\s*:\s*(\d+)""")
            .find(chunk)
            ?.groupValues
            ?.get(1)
            ?.toIntOrNull() ?: 0
    return ChecklistRunDto(
        runId = f("runId"),
        checklistId = f("checklistId"),
        stepIndex = step,
        status = f("status"),
    )
}
