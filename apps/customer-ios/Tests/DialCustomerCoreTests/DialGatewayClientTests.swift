import XCTest
@testable import DialCustomerCore

final class DialGatewayClientTests: XCTestCase {
    func testSignInStoresDialSessionCookie() throws {
        let store = MemoryCookieStore()
        let transport = MockTransport { method, url, _, body, _ in
            XCTAssertEqual(method, "POST")
            XCTAssertTrue(url.hasSuffix("/api/auth/sign-in"))
            XCTAssertFalse(body!.contains("userId"))
            XCTAssertFalse(body!.contains("\"role\""))
            return HttpResponse(
                statusCode: 200,
                body: #"{"userId":"u1","email":"buyer@dial.test","buyerSegment":"b2c"}"#,
                setCookieHeaders: ["dial_session=tok_abc; Path=/; HttpOnly"]
            )
        }
        let client = DialGatewayClient(baseUrl: "http://localhost:3000", cookies: store, transport: transport)
        let session = try client.signIn(email: "buyer@dial.test", password: "secret123")
        XCTAssertEqual(session.userId, "u1")
        XCTAssertEqual(store.getCookieHeader(), "dial_session=tok_abc")
    }

    func testSearchSpareRequiresUsdCurrency() throws {
        let store = MemoryCookieStore()
        store.storeFromSetCookie(["dial_session=tok; Path=/"])
        let transport = MockTransport { _, url, _, _, cookie in
            XCTAssertTrue(url.contains("/api/search/spare"))
            XCTAssertFalse(url.contains("role="))
            XCTAssertEqual(cookie, "dial_session=tok")
            return HttpResponse(
                statusCode: 200,
                body: #"{"q":"filter","currency":"USD","sessionRole":"b2c","hits":[{"offerId":"o1","title":"Oil filter","unitPriceUsdMinor":"1250","brand":"Bosch","oem":"OEM1","qualityTier":"OEM","offerSource":"MARKETPLACE","supplierFormality":"formal"}]}"#
            )
        }
        let client = DialGatewayClient(baseUrl: "http://localhost:3000", cookies: store, transport: transport)
        let result = try client.searchSpare(q: "filter")
        XCTAssertEqual(result.currency, "USD")
        XCTAssertEqual(result.hits.count, 1)
        XCTAssertEqual(result.hits[0].unitPriceUsdMinor, 1250)
    }

    func testCheckoutRejectsNonButtonChoice() {
        let client = DialGatewayClient(baseUrl: "http://localhost:3000")
        XCTAssertThrowsError(try client.checkoutSpare(offerId: "o1", choice: "paypal")) { err in
            XCTAssertEqual(err as? DialGatewayError, .invalidChoice)
        }
    }

    func testCheckoutEcoCashWithoutIdentityInBody() throws {
        let transport = MockTransport { method, url, _, body, _ in
            XCTAssertEqual(method, "POST")
            XCTAssertTrue(url.hasSuffix("/api/spare/checkout"))
            XCTAssertTrue(body!.contains(#""choice":"ecocash""#))
            XCTAssertFalse(body!.contains("userId"))
            XCTAssertFalse(body!.contains("\"role\""))
            return HttpResponse(
                statusCode: 200,
                body: #"{"ok":true,"currency":"USD","cartTotalUsdMinor":"1250","choice":"ecocash","intentId":"pi_1","fxRateId":"fx_1","soldBy":"Sold by Bosch","imttOnCheckoutLines":false,"cartId":"cart_1"}"#
            )
        }
        let client = DialGatewayClient(baseUrl: "http://localhost:3000", cookies: MemoryCookieStore(), transport: transport)
        let result = try client.checkoutSpare(offerId: "o1", choice: "ecocash")
        XCTAssertTrue(result.ok)
        XCTAssertEqual(result.currency, "USD")
        XCTAssertFalse(result.imttOnCheckoutLines)
        XCTAssertEqual(result.intentId, "pi_1")
        XCTAssertEqual(result.cartId, "cart_1")
    }

    func testPd20PlaceTrackReturnGarageGrocery() throws {
        var step = 0
        let transport = MockTransport { method, url, _, body, _ in
            if method == "POST", url.hasSuffix("/api/spare/orders") {
                XCTAssertTrue(body!.contains(#""payChoice":"cod""#))
                XCTAssertFalse(body!.contains("\"role\""))
                step += 1
                return HttpResponse(
                    statusCode: 200,
                    body: #"{"ok":true,"order":{"orderId":"sord_1","status":"confirmed","currency":"USD","totalUsdMinor":"1250","payChoice":"cod","soldBySummary":"Bosch"}}"#
                )
            }
            if method == "GET", url.contains("orderId=") {
                step += 1
                return HttpResponse(
                    statusCode: 200,
                    body: #"{"order":{"orderId":"sord_1","status":"awaiting_supplier","currency":"USD","totalUsdMinor":"1250","payChoice":"cod","soldBySummary":"Bosch"},"statusFrom":"erp","zigOnTrack":false}"#
                )
            }
            if method == "POST", url.hasSuffix("/api/spare/returns") {
                step += 1
                return HttpResponse(
                    statusCode: 200,
                    body: #"{"ok":true,"claim":{"claimId":"sret_1","orderId":"sord_1","status":"opened","payableFromAi":false}}"#
                )
            }
            if method == "POST", url.hasSuffix("/api/spare/garage") {
                step += 1
                return HttpResponse(
                    statusCode: 200,
                    body: #"{"ok":true,"vehicle":{"vehicleId":"veh_1","customerId":"u1","label":"Hilux","chassisHint":"KUN26","reminderConsent":true}}"#
                )
            }
            if method == "GET", url.contains("/api/search/grocery") {
                XCTAssertFalse(url.contains("role="))
                step += 1
                return HttpResponse(
                    statusCode: 200,
                    body: #"{"q":"mealie","currency":"USD","liquorSkus":false,"hits":[{"offerId":"g1","title":"Mealie meal","unitPriceUsdMinor":"500","brand":"Ngwena","unitLabel":"2kg","coldChain":false,"offerSource":"MARKETPLACE","supplierFormality":"formal"}]}"#
                )
            }
            XCTFail("unexpected \(method) \(url)")
            return HttpResponse(statusCode: 500, body: "{}")
        }
        let client = DialGatewayClient(baseUrl: "http://localhost:3000", cookies: MemoryCookieStore(), transport: transport)
        let order = try client.placeSpareOrder(cartId: "cart_1", payChoice: "cod", customerId: "u1")
        XCTAssertEqual(order.orderId, "sord_1")
        let track = try client.trackSpareOrder(orderId: "sord_1")
        XCTAssertFalse(track.zigOnTrack)
        let claim = try client.openSpareReturn(orderId: "sord_1")
        XCTAssertFalse(claim.payableFromAi)
        let vehicle = try client.addGarageVehicle(
            customerId: "u1",
            label: "Hilux",
            chassisHint: "KUN26",
            reminderConsent: true
        )
        XCTAssertTrue(vehicle.reminderConsent)
        let grocery = try client.searchGrocery(q: "mealie")
        XCTAssertEqual(grocery.currency, "USD")
        XCTAssertFalse(grocery.liquorSkus)
        XCTAssertEqual(step, 5)
    }
}

struct MockTransport: HttpTransport {
    let handler: @Sendable (String, String, [String: String], String?, String?) -> HttpResponse

    func request(
        method: String,
        url: String,
        headers: [String: String],
        body: String?,
        cookieHeader: String?
    ) throws -> HttpResponse {
        handler(method, url, headers, body, cookieHeader)
    }
}
