import Foundation

/// PD8 customer-iOS gateway client — same ERP paths as PD5 Android.
/// Session SoR = `dial_session` cookie; never body userId/role (D-47).
/// Browse/cart currency = USD (D-57).

public struct DialSession: Equatable, Sendable {
    public let userId: String
    public let email: String
    public let buyerSegment: String
}

public struct SpareOfferHit: Equatable, Sendable, Identifiable {
    public var id: String { offerId }
    public let offerId: String
    public let title: String
    public let unitPriceUsdMinor: Int64
    public let brand: String
    public let oem: String
    public let qualityTier: String
    public let offerSource: String
    public let supplierFormality: String
}

public struct SpareSearchResult: Equatable, Sendable {
    public let q: String
    public let currency: String
    public let sessionRole: String
    public let hits: [SpareOfferHit]
}

public struct SpareCheckoutResult: Equatable, Sendable {
    public let ok: Bool
    public let currency: String
    public let cartTotalUsdMinor: Int64
    public let choice: String
    public let intentId: String?
    public let fxRateId: String?
    public let soldBy: String?
    public let imttOnCheckoutLines: Bool
}

public enum DialGatewayError: Error, Equatable {
    case http(status: Int, message: String)
    case invalidChoice
    case missingField(String)
}

public protocol CookieStore: AnyObject {
    func getCookieHeader() -> String?
    func storeFromSetCookie(_ headers: [String])
}

public final class MemoryCookieStore: CookieStore, @unchecked Sendable {
    private var cookie: String?

    public init() {}

    public func getCookieHeader() -> String? { cookie }

    public func storeFromSetCookie(_ headers: [String]) {
        for raw in headers {
            let part = raw.split(separator: ";").first.map(String.init)?.trimmingCharacters(in: .whitespaces) ?? ""
            if part.hasPrefix("dial_session=") {
                cookie = part
                return
            }
        }
    }

    public func clear() { cookie = nil }
    public func hasSession() -> Bool { !(cookie?.isEmpty ?? true) }
}

public struct HttpResponse: Sendable {
    public let statusCode: Int
    public let body: String
    public let setCookieHeaders: [String]

    public init(statusCode: Int, body: String, setCookieHeaders: [String] = []) {
        self.statusCode = statusCode
        self.body = body
        self.setCookieHeaders = setCookieHeaders
    }
}

public protocol HttpTransport: Sendable {
    func request(
        method: String,
        url: String,
        headers: [String: String],
        body: String?,
        cookieHeader: String?
    ) throws -> HttpResponse
}

public struct URLSessionTransport: HttpTransport {
    public init() {}

    public func request(
        method: String,
        url: String,
        headers: [String: String],
        body: String?,
        cookieHeader: String?
    ) throws -> HttpResponse {
        guard let endpoint = URL(string: url) else {
            throw DialGatewayError.http(status: 0, message: "bad url")
        }
        var req = URLRequest(url: endpoint)
        req.httpMethod = method
        req.timeoutInterval = 15
        for (k, v) in headers { req.setValue(v, forHTTPHeaderField: k) }
        if let cookieHeader, !cookieHeader.isEmpty {
            req.setValue(cookieHeader, forHTTPHeaderField: "Cookie")
        }
        if let body {
            req.httpBody = body.data(using: .utf8)
        }
        let sem = DispatchSemaphore(value: 0)
        var result: Result<HttpResponse, Error>!
        URLSession.shared.dataTask(with: req) { data, response, error in
            if let error {
                result = .failure(error)
                sem.signal()
                return
            }
            let http = response as? HTTPURLResponse
            let code = http?.statusCode ?? 0
            let text = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
            var setCookies: [String] = []
            if let headers = http?.allHeaderFields {
                for (k, v) in headers {
                    if String(describing: k).lowercased() == "set-cookie" {
                        setCookies.append(String(describing: v))
                    }
                }
            }
            result = .success(HttpResponse(statusCode: code, body: text, setCookieHeaders: setCookies))
            sem.signal()
        }.resume()
        sem.wait()
        return try result.get()
    }
}

public final class DialGatewayClient: @unchecked Sendable {
    private let baseUrl: String
    private let cookies: CookieStore
    private let transport: HttpTransport

    public init(
        baseUrl: String,
        cookies: CookieStore = MemoryCookieStore(),
        transport: HttpTransport = URLSessionTransport()
    ) {
        self.baseUrl = baseUrl.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        self.cookies = cookies
        self.transport = transport
    }

    public func signIn(email: String, password: String) throws -> DialSession {
        precondition(!email.isEmpty && !password.isEmpty)
        let body = #"{"email":\#(jsonString(email)),"password":\#(jsonString(password))}"#
        let res = try transport.request(
            method: "POST",
            url: "\(baseUrl)/api/auth/sign-in",
            headers: [
                "Content-Type": "application/json",
                "Accept": "application/json",
            ],
            body: body,
            cookieHeader: cookies.getCookieHeader()
        )
        cookies.storeFromSetCookie(res.setCookieHeaders)
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "sign-in failed")
        }
        return try parseSession(res.body)
    }

    public func searchSpare(q: String = "") throws -> SpareSearchResult {
        let encoded = q.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? q
        let res = try transport.request(
            method: "GET",
            url: "\(baseUrl)/api/search/spare?q=\(encoded)",
            headers: ["Accept": "application/json"],
            body: nil,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "search failed")
        }
        // Client never appends role/userId query params (D-47).
        return try parseSpareSearch(res.body)
    }

    public func checkoutSpare(offerId: String, choice: String, qty: Int = 1) throws -> SpareCheckoutResult {
        guard choice == "ecocash" || choice == "cod" else {
            throw DialGatewayError.invalidChoice
        }
        // D-47: never send userId/role in body.
        let body =
            #"{"offerId":\#(jsonString(offerId)),"choice":\#(jsonString(choice)),"qty":\#(qty)}"#
        precondition(!body.contains("userId") && !body.contains("\"role\""))
        let res = try transport.request(
            method: "POST",
            url: "\(baseUrl)/api/spare/checkout",
            headers: [
                "Content-Type": "application/json",
                "Accept": "application/json",
            ],
            body: body,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "checkout failed")
        }
        return try parseCheckout(res.body)
    }
}

// MARK: - JSON helpers (fixture-light; no Codable dependency on gateway shape drift)

func jsonString(_ value: String) -> String {
    var out = "\""
    for c in value {
        switch c {
        case "\\": out += "\\\\"
        case "\"": out += "\\\""
        case "\n": out += "\\n"
        default: out.append(c)
        }
    }
    out += "\""
    return out
}

func parseError(_ body: String) -> String? {
    guard let r = try? NSRegularExpression(pattern: #""error"\s*:\s*"([^"]+)""#) else { return nil }
    let range = NSRange(body.startIndex..., in: body)
    guard let m = r.firstMatch(in: body, range: range), m.numberOfRanges > 1,
          let swiftRange = Range(m.range(at: 1), in: body) else { return nil }
    return String(body[swiftRange])
}

func field(_ name: String, in body: String) throws -> String {
    let pattern = #""\#(name)"\s*:\s*"([^"]*)""#
    guard let r = try? NSRegularExpression(pattern: pattern),
          let m = r.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)),
          m.numberOfRanges > 1,
          let swiftRange = Range(m.range(at: 1), in: body)
    else {
        throw DialGatewayError.missingField(name)
    }
    return String(body[swiftRange])
}

func optionalField(_ name: String, in body: String) -> String? {
    try? field(name, in: body)
}

func intField(_ name: String, in body: String) -> Int64 {
    let pattern = #""\#(name)"\s*:\s*"?(\d+)"?"#
    guard let r = try? NSRegularExpression(pattern: pattern),
          let m = r.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)),
          m.numberOfRanges > 1,
          let swiftRange = Range(m.range(at: 1), in: body)
    else { return 0 }
    return Int64(body[swiftRange]) ?? 0
}

func parseSession(_ body: String) throws -> DialSession {
    DialSession(
        userId: try field("userId", in: body),
        email: try field("email", in: body),
        buyerSegment: try field("buyerSegment", in: body)
    )
}

func parseSpareSearch(_ body: String) throws -> SpareSearchResult {
    let currency = (try? field("currency", in: body)) ?? "USD"
    let sessionRole = (try? field("sessionRole", in: body)) ?? "b2c"
    let q = (try? field("q", in: body)) ?? ""
    var hits: [SpareOfferHit] = []
    guard let r = try? NSRegularExpression(pattern: #"\{[^{}]*"offerId"\s*:\s*"([^"]+)"[^{}]*\}"#, options: [.dotMatchesLineSeparators]) else {
        return SpareSearchResult(q: q, currency: currency, sessionRole: sessionRole, hits: [])
    }
    let ns = body as NSString
    r.enumerateMatches(in: body, range: NSRange(location: 0, length: ns.length)) { match, _, _ in
        guard let match else { return }
        let chunk = ns.substring(with: match.range)
        func f(_ n: String) -> String { (try? field(n, in: chunk)) ?? "" }
        hits.append(
            SpareOfferHit(
                offerId: f("offerId"),
                title: f("title"),
                unitPriceUsdMinor: intField("unitPriceUsdMinor", in: chunk),
                brand: f("brand"),
                oem: f("oem"),
                qualityTier: f("qualityTier"),
                offerSource: f("offerSource"),
                supplierFormality: f("supplierFormality")
            )
        )
    }
    return SpareSearchResult(q: q, currency: currency, sessionRole: sessionRole, hits: hits)
}

func parseCheckout(_ body: String) throws -> SpareCheckoutResult {
    SpareCheckoutResult(
        ok: body.contains("\"ok\":true") || body.contains("\"ok\": true"),
        currency: (try? field("currency", in: body)) ?? "USD",
        cartTotalUsdMinor: intField("cartTotalUsdMinor", in: body),
        choice: (try? field("choice", in: body)) ?? "",
        intentId: optionalField("intentId", in: body),
        fxRateId: optionalField("fxRateId", in: body),
        soldBy: optionalField("soldBy", in: body),
        imttOnCheckoutLines: {
            if let r = try? NSRegularExpression(pattern: #""imttOnCheckoutLines"\s*:\s*true"#),
               r.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)) != nil {
                return true
            }
            return false
        }()
    )
}
