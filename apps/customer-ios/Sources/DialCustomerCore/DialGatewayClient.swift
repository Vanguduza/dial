import Foundation

/// PD8/PD20 customer-iOS gateway client — same ERP paths as Android (Pack §9.6).
/// Session SoR = `dial_session` cookie; never body userId/role (D-47).
/// Browse/cart currency = USD (D-57). Orders/returns/garage + grocery search.

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
    /// Agency disclosure — Sold by {Supplier} Agency (D-58 / PD42).
    public let soldBy: String
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
    public let cartId: String?
}

public struct SpareOrderSummary: Equatable, Sendable, Identifiable {
    public var id: String { orderId }
    public let orderId: String
    public let status: String
    public let currency: String
    public let totalUsdMinor: Int64
    public let payChoice: String
    public let soldBySummary: String
}

public struct SpareTrackResult: Equatable, Sendable {
    public let order: SpareOrderSummary
    public let statusFrom: String
    public let zigOnTrack: Bool
}

public struct SpareReturnClaim: Equatable, Sendable {
    public let claimId: String
    public let orderId: String
    public let status: String
    public let payableFromAi: Bool
}

public struct GarageVehicle: Equatable, Sendable, Identifiable {
    public var id: String { vehicleId }
    public let vehicleId: String
    public let customerId: String
    public let label: String
    public let chassisHint: String
    public let reminderConsent: Bool
}

public struct GroceryOfferHit: Equatable, Sendable, Identifiable {
    public var id: String { offerId }
    public let offerId: String
    public let title: String
    public let unitPriceUsdMinor: Int64
    public let brand: String
    public let unitLabel: String
    public let coldChain: Bool
    public let offerSource: String
    public let supplierFormality: String
    /// Agency supplier display name (D-58 / PD42).
    public let supplierDisplayName: String
}

public struct GrocerySearchResult: Equatable, Sendable {
    public let q: String
    public let currency: String
    public let liquorSkus: Bool
    public let hits: [GroceryOfferHit]
}

public struct GroceryCheckoutResult: Equatable, Sendable {
    public let ok: Bool
    public let currency: String
    public let cartTotalUsdMinor: Int64
    public let soldBy: String?
    public let imttOnCheckoutLines: Bool
    public let groceryOrderId: String?
}

public struct GroceryTrackResult: Equatable, Sendable {
    public let orderId: String
    public let status: String
    public let statusFrom: String
    public let currency: String
    public let totalUsdMinor: Int64
    public let payChoice: String
    public let soldBy: String
    public let liquorAllowed: Bool
}

public struct PromoCodeResult: Equatable, Sendable {
    public let ok: Bool
    public let code: String?
    public let draftDiscountPercent: Int
    public let payableFromAi: Bool
    public let cashOutAllowed: Bool
}

public struct ReferralShareResult: Equatable, Sendable {
    public let shareCode: String
    public let shareUrl: String
    public let cashOutAllowed: Bool
    public let rewardKind: String
}

public struct TechHomeResult: Equatable, Sendable {
    public let guideTitle: String
    public let aiHypeForbidden: Bool
}

public struct TechSlotsResult: Equatable, Sendable {
    public let slotIds: [String]
    public let quoteSource: String
    public let draftAmountUsdMinor: Int64
    public let payableFromAi: Bool
}

public struct TechBookResult: Equatable, Sendable {
    public let jobId: String
    public let draftOnly: Bool
    public let payableFromAi: Bool
    public let draftAmountUsdMinor: Int64
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

    /// PD20 — place ERP order after checkout (Pack §9.6 / PD18 parity).
    public func placeSpareOrder(cartId: String, payChoice: String, customerId: String? = nil) throws -> SpareOrderSummary {
        guard payChoice == "ecocash" || payChoice == "cod" else {
            throw DialGatewayError.invalidChoice
        }
        var body = #"{"cartId":\#(jsonString(cartId)),"payChoice":\#(jsonString(payChoice))"#
        if let customerId, !customerId.isEmpty {
            body += #","customerId":\#(jsonString(customerId))"#
        }
        body += "}"
        precondition(!body.contains("\"role\""))
        let res = try transport.request(
            method: "POST",
            url: "\(baseUrl)/api/spare/orders",
            headers: [
                "Content-Type": "application/json",
                "Accept": "application/json",
            ],
            body: body,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "place order failed")
        }
        return try parseOrder(res.body)
    }

    public func listSpareOrders(customerId: String? = nil) throws -> [SpareOrderSummary] {
        var url = "\(baseUrl)/api/spare/orders"
        if let customerId, !customerId.isEmpty {
            let enc = customerId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? customerId
            url += "?customerId=\(enc)"
        }
        let res = try transport.request(
            method: "GET",
            url: url,
            headers: ["Accept": "application/json"],
            body: nil,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "list orders failed")
        }
        return parseOrderList(res.body)
    }

    public func trackSpareOrder(orderId: String) throws -> SpareTrackResult {
        let enc = orderId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? orderId
        let res = try transport.request(
            method: "GET",
            url: "\(baseUrl)/api/spare/orders?orderId=\(enc)",
            headers: ["Accept": "application/json"],
            body: nil,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "track failed")
        }
        let order = try parseOrder(res.body)
        let zigOnTrack: Bool = {
            if let r = try? NSRegularExpression(pattern: #""zigOnTrack"\s*:\s*true"#),
               r.firstMatch(in: res.body, range: NSRange(res.body.startIndex..., in: res.body)) != nil {
                return true
            }
            return false
        }()
        let statusFrom = (try? field("statusFrom", in: res.body)) ?? "erp"
        return SpareTrackResult(order: order, statusFrom: statusFrom, zigOnTrack: zigOnTrack)
    }

    public func openSpareReturn(orderId: String) throws -> SpareReturnClaim {
        let body = #"{"action":"open","orderId":\#(jsonString(orderId)),"path":"refund_or_replace"}"#
        let res = try transport.request(
            method: "POST",
            url: "\(baseUrl)/api/spare/returns",
            headers: [
                "Content-Type": "application/json",
                "Accept": "application/json",
            ],
            body: body,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "return open failed")
        }
        return parseReturnClaim(res.body)
    }

    public func listGarageVehicles(customerId: String) throws -> [GarageVehicle] {
        let enc = customerId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? customerId
        let res = try transport.request(
            method: "GET",
            url: "\(baseUrl)/api/spare/garage?customerId=\(enc)",
            headers: ["Accept": "application/json"],
            body: nil,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "garage list failed")
        }
        return parseGarageList(res.body)
    }

    public func addGarageVehicle(
        customerId: String,
        label: String,
        chassisHint: String,
        reminderConsent: Bool
    ) throws -> GarageVehicle {
        let body =
            #"{"customerId":\#(jsonString(customerId)),"label":\#(jsonString(label)),"chassisHint":\#(jsonString(chassisHint)),"reminderConsent":\#(reminderConsent ? "true" : "false")}"#
        let res = try transport.request(
            method: "POST",
            url: "\(baseUrl)/api/spare/garage",
            headers: [
                "Content-Type": "application/json",
                "Accept": "application/json",
            ],
            body: body,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "garage add failed")
        }
        return parseGarageVehicle(res.body)
    }

    public func searchGrocery(q: String = "") throws -> GrocerySearchResult {
        let encoded = q.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? q
        let res = try transport.request(
            method: "GET",
            url: "\(baseUrl)/api/search/grocery?q=\(encoded)",
            headers: ["Accept": "application/json"],
            body: nil,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "grocery search failed")
        }
        return parseGrocerySearch(res.body)
    }

    public func checkoutGrocery(offerId: String, choice: String) throws -> GroceryCheckoutResult {
        guard choice == "ecocash" || choice == "cod" else {
            throw DialGatewayError.invalidChoice
        }
        // D-47: never send userId/role in body.
        let body = #"{"offerId":\#(jsonString(offerId)),"choice":\#(jsonString(choice))}"#
        precondition(!body.contains("userId") && !body.contains("\"role\""))
        let res = try transport.request(
            method: "POST",
            url: "\(baseUrl)/api/grocery/checkout",
            headers: [
                "Content-Type": "application/json",
                "Accept": "application/json",
            ],
            body: body,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "grocery checkout failed")
        }
        return parseGroceryCheckout(res.body)
    }

    /// PD42 — grocery ERP track parity with web `/api/grocery/track`.
    public func trackGrocery(orderId: String) throws -> GroceryTrackResult {
        let enc = orderId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? orderId
        let res = try transport.request(
            method: "GET",
            url: "\(baseUrl)/api/grocery/track?orderId=\(enc)",
            headers: ["Accept": "application/json"],
            body: nil,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "grocery track failed")
        }
        return parseGroceryTrack(res.body)
    }

    /// PD21 — validate promo code (draft only; D-42).
    public func validatePromoCode(code: String, vertical: String = "spare") throws -> PromoCodeResult {
        let body =
            #"{"action":"validate_code","code":\#(jsonString(code)),"vertical":\#(jsonString(vertical))}"#
        precondition(!body.contains("userId") && !body.contains("\"role\""))
        let res = try transport.request(
            method: "POST",
            url: "\(baseUrl)/api/promo",
            headers: [
                "Content-Type": "application/json",
                "Accept": "application/json",
            ],
            body: body,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "promo validate failed")
        }
        return parsePromoCodeResult(res.body)
    }

    public func applyPromoCodeDraft(code: String, cartId: String, vertical: String = "spare") throws -> PromoCodeResult {
        let body =
            #"{"action":"apply_draft","code":\#(jsonString(code)),"cartId":\#(jsonString(cartId)),"vertical":\#(jsonString(vertical))}"#
        precondition(!body.contains("userId") && !body.contains("\"role\""))
        let res = try transport.request(
            method: "POST",
            url: "\(baseUrl)/api/promo",
            headers: [
                "Content-Type": "application/json",
                "Accept": "application/json",
            ],
            body: body,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "promo apply failed")
        }
        return parsePromoCodeResult(res.body)
    }

    public func shareReferral(campaignId: String, codeSuffix: String? = nil) throws -> ReferralShareResult {
        var body = #"{"action":"share_referral","campaignId":\#(jsonString(campaignId))"#
        if let codeSuffix, !codeSuffix.isEmpty {
            body += #","codeSuffix":\#(jsonString(codeSuffix))"#
        }
        body += "}"
        precondition(!body.contains("\"role\""))
        let res = try transport.request(
            method: "POST",
            url: "\(baseUrl)/api/promo",
            headers: [
                "Content-Type": "application/json",
                "Accept": "application/json",
            ],
            body: body,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "referral share failed")
        }
        return parseReferralShare(res.body)
    }

    /// Returns false when cash-out blocked (expected D-42).
    public func attemptPromoCashOut(amountMinor: Int64) throws -> Bool {
        let body = #"{"action":"attempt_cash_out","amountMinor":"\#(amountMinor)"}"#
        let res = try transport.request(
            method: "POST",
            url: "\(baseUrl)/api/promo",
            headers: [
                "Content-Type": "application/json",
                "Accept": "application/json",
            ],
            body: body,
            cookieHeader: cookies.getCookieHeader()
        )
        if res.statusCode == 403, res.body.contains("promo_credit_cash_out_forbidden") {
            return false
        }
        throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "unexpected cash-out")
    }

    public func techHome() throws -> TechHomeResult {
        let res = try transport.request(
            method: "GET",
            url: "\(baseUrl)/api/tech/services",
            headers: ["Accept": "application/json"],
            body: nil,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "tech home failed")
        }
        return parseTechHome(res.body)
    }

    public func techSlots() throws -> TechSlotsResult {
        let res = try transport.request(
            method: "GET",
            url: "\(baseUrl)/api/tech/services?view=slots",
            headers: ["Accept": "application/json"],
            body: nil,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "tech slots failed")
        }
        return parseTechSlots(res.body)
    }

    public func bookTechGuide(slotId: String) throws -> TechBookResult {
        let body =
            #"{"action":"book","slotId":\#(jsonString(slotId)),"jobClass":"diagnostics","emergency":false}"#
        precondition(!body.contains("userId") && !body.contains("\"role\""))
        let res = try transport.request(
            method: "POST",
            url: "\(baseUrl)/api/tech/services",
            headers: [
                "Content-Type": "application/json",
                "Accept": "application/json",
            ],
            body: body,
            cookieHeader: cookies.getCookieHeader()
        )
        guard (200 ... 299).contains(res.statusCode) else {
            throw DialGatewayError.http(status: res.statusCode, message: parseError(res.body) ?? "tech book failed")
        }
        return parseTechBook(res.body)
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
                supplierFormality: f("supplierFormality"),
                soldBy: {
                    let s = f("soldBy")
                    return s.isEmpty ? "\(f("brand")) Agency" : s
                }()
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
        }(),
        cartId: optionalField("cartId", in: body)
    )
}

func parseOrder(_ body: String) throws -> SpareOrderSummary {
    SpareOrderSummary(
        orderId: (try? field("orderId", in: body)) ?? "",
        status: (try? field("status", in: body)) ?? "",
        currency: (try? field("currency", in: body)) ?? "USD",
        totalUsdMinor: intField("totalUsdMinor", in: body),
        payChoice: (try? field("payChoice", in: body)) ?? "",
        soldBySummary: (try? field("soldBySummary", in: body)) ?? ""
    )
}

func parseOrderList(_ body: String) -> [SpareOrderSummary] {
    var orders: [SpareOrderSummary] = []
    guard let r = try? NSRegularExpression(pattern: #"\{[^{}]*"orderId"\s*:\s*"([^"]+)"[^{}]*\}"#, options: [.dotMatchesLineSeparators]) else {
        return []
    }
    let ns = body as NSString
    r.enumerateMatches(in: body, range: NSRange(location: 0, length: ns.length)) { match, _, _ in
        guard let match else { return }
        let chunk = ns.substring(with: match.range)
        if let o = try? parseOrder(chunk) {
            orders.append(o)
        }
    }
    return orders
}

func parseReturnClaim(_ body: String) -> SpareReturnClaim {
    let payable: Bool = {
        if let r = try? NSRegularExpression(pattern: #""payableFromAi"\s*:\s*true"#),
           r.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)) != nil {
            return true
        }
        return false
    }()
    return SpareReturnClaim(
        claimId: (try? field("claimId", in: body)) ?? "",
        orderId: (try? field("orderId", in: body)) ?? "",
        status: (try? field("status", in: body)) ?? "",
        payableFromAi: payable
    )
}

func parseGarageVehicle(_ body: String) -> GarageVehicle {
    GarageVehicle(
        vehicleId: (try? field("vehicleId", in: body)) ?? "",
        customerId: (try? field("customerId", in: body)) ?? "",
        label: (try? field("label", in: body)) ?? "",
        chassisHint: (try? field("chassisHint", in: body)) ?? "",
        reminderConsent: {
            if let r = try? NSRegularExpression(pattern: #""reminderConsent"\s*:\s*true"#),
               r.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)) != nil {
                return true
            }
            return false
        }()
    )
}

func parseGarageList(_ body: String) -> [GarageVehicle] {
    var out: [GarageVehicle] = []
    guard let r = try? NSRegularExpression(pattern: #"\{[^{}]*"vehicleId"\s*:\s*"([^"]+)"[^{}]*\}"#, options: [.dotMatchesLineSeparators]) else {
        return []
    }
    let ns = body as NSString
    r.enumerateMatches(in: body, range: NSRange(location: 0, length: ns.length)) { match, _, _ in
        guard let match else { return }
        out.append(parseGarageVehicle(ns.substring(with: match.range)))
    }
    return out
}

func parseGrocerySearch(_ body: String) -> GrocerySearchResult {
    let currency = (try? field("currency", in: body)) ?? "USD"
    let q = (try? field("q", in: body)) ?? ""
    let liquor: Bool = {
        if let r = try? NSRegularExpression(pattern: #""liquorSkus"\s*:\s*true"#),
           r.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)) != nil {
            return true
        }
        return false
    }()
    var hits: [GroceryOfferHit] = []
    if let r = try? NSRegularExpression(pattern: #"\{[^{}]*"offerId"\s*:\s*"([^"]+)"[^{}]*\}"#, options: [.dotMatchesLineSeparators]) {
        let ns = body as NSString
        r.enumerateMatches(in: body, range: NSRange(location: 0, length: ns.length)) { match, _, _ in
            guard let match else { return }
            let chunk = ns.substring(with: match.range)
            func f(_ n: String) -> String { (try? field(n, in: chunk)) ?? "" }
            let cold: Bool = {
                if let rr = try? NSRegularExpression(pattern: #""coldChain"\s*:\s*true"#),
                   rr.firstMatch(in: chunk, range: NSRange(chunk.startIndex..., in: chunk)) != nil {
                    return true
                }
                return false
            }()
            hits.append(
                GroceryOfferHit(
                    offerId: f("offerId"),
                    title: f("title"),
                    unitPriceUsdMinor: intField("unitPriceUsdMinor", in: chunk),
                    brand: f("brand"),
                    unitLabel: f("unitLabel"),
                    coldChain: cold,
                    offerSource: f("offerSource"),
                    supplierFormality: f("supplierFormality"),
                    supplierDisplayName: {
                        let s = f("supplierDisplayName")
                        return s.isEmpty ? f("brand") : s
                    }()
                )
            )
        }
    }
    return GrocerySearchResult(q: q, currency: currency, liquorSkus: liquor, hits: hits)
}

func parseGroceryCheckout(_ body: String) -> GroceryCheckoutResult {
    GroceryCheckoutResult(
        ok: body.contains("\"ok\":true") || body.contains("\"ok\": true"),
        currency: (try? field("currency", in: body)) ?? "USD",
        cartTotalUsdMinor: intField("cartTotalUsdMinor", in: body),
        soldBy: optionalField("soldBy", in: body),
        imttOnCheckoutLines: {
            if let r = try? NSRegularExpression(pattern: #""imttOnCheckoutLines"\s*:\s*true"#),
               r.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)) != nil {
                return true
            }
            return false
        }(),
        groceryOrderId: optionalField("groceryOrderId", in: body)
    )
}

func parseGroceryTrack(_ body: String) -> GroceryTrackResult {
    GroceryTrackResult(
        orderId: (try? field("orderId", in: body)) ?? "",
        status: (try? field("status", in: body)) ?? "",
        statusFrom: (try? field("statusFrom", in: body)) ?? "erp",
        currency: (try? field("currency", in: body)) ?? "USD",
        totalUsdMinor: intField("totalUsdMinor", in: body),
        payChoice: (try? field("payChoice", in: body)) ?? "",
        soldBy: (try? field("soldBy", in: body)) ?? "",
        liquorAllowed: {
            if let r = try? NSRegularExpression(pattern: #""liquorAllowed"\s*:\s*true"#),
               r.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)) != nil {
                return true
            }
            return false
        }()
    )
}

func parsePromoCodeResult(_ body: String) -> PromoCodeResult {
    PromoCodeResult(
        ok: body.contains("\"ok\":true") || body.contains("\"ok\": true"),
        code: optionalField("code", in: body),
        draftDiscountPercent: Int(intField("draftDiscountPercent", in: body)),
        payableFromAi: {
            if let r = try? NSRegularExpression(pattern: #""payableFromAi"\s*:\s*true"#),
               r.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)) != nil {
                return true
            }
            return false
        }(),
        cashOutAllowed: {
            if let r = try? NSRegularExpression(pattern: #""cashOutAllowed"\s*:\s*true"#),
               r.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)) != nil {
                return true
            }
            return false
        }()
    )
}

func parseReferralShare(_ body: String) -> ReferralShareResult {
    ReferralShareResult(
        shareCode: (try? field("shareCode", in: body)) ?? "",
        shareUrl: (try? field("shareUrl", in: body)) ?? "",
        cashOutAllowed: {
            if let r = try? NSRegularExpression(pattern: #""cashOutAllowed"\s*:\s*true"#),
               r.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)) != nil {
                return true
            }
            return false
        }(),
        rewardKind: (try? field("rewardKind", in: body)) ?? "promo_credit"
    )
}

func parseTechHome(_ body: String) -> TechHomeResult {
    TechHomeResult(
        guideTitle: (try? field("title", in: body)) ?? "Dial a Tech",
        aiHypeForbidden: {
            if let r = try? NSRegularExpression(pattern: #""aiHypeForbidden"\s*:\s*false"#),
               r.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)) != nil {
                return false
            }
            return true
        }()
    )
}

func parseTechSlots(_ body: String) -> TechSlotsResult {
    var slotIds: [String] = []
    if let r = try? NSRegularExpression(pattern: #""(?:slotId|id)"\s*:\s*"([^"]+)""#) {
        let ns = body as NSString
        r.enumerateMatches(in: body, range: NSRange(location: 0, length: ns.length)) { match, _, _ in
            guard let match, match.numberOfRanges > 1,
                  let range = Range(match.range(at: 1), in: body) else { return }
            slotIds.append(String(body[range]))
        }
    }
    return TechSlotsResult(
        slotIds: Array(Set(slotIds)),
        quoteSource: (try? field("source", in: body)) ?? "rate_card",
        draftAmountUsdMinor: intField("draftAmountUsdMinor", in: body),
        payableFromAi: {
            if let r = try? NSRegularExpression(pattern: #""payableFromAi"\s*:\s*true"#),
               r.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)) != nil {
                return true
            }
            return false
        }()
    )
}

func parseTechBook(_ body: String) -> TechBookResult {
    TechBookResult(
        jobId: (try? field("id", in: body)) ?? ((try? field("jobId", in: body)) ?? ""),
        draftOnly: body.contains("\"draftOnly\":true") || body.contains("\"draftOnly\": true") ||
            {
                if let r = try? NSRegularExpression(pattern: #""draftOnly"\s*:\s*false"#),
                   r.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)) != nil {
                    return false
                }
                return true
            }(),
        payableFromAi: {
            if let r = try? NSRegularExpression(pattern: #""payableFromAi"\s*:\s*true"#),
               r.firstMatch(in: body, range: NSRange(body.startIndex..., in: body)) != nil {
                return true
            }
            return false
        }(),
        draftAmountUsdMinor: intField("draftAmountUsdMinor", in: body)
    )
}
