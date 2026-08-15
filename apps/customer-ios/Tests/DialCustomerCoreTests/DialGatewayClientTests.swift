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
                body: #"{"q":"filter","currency":"USD","sessionRole":"b2c","hits":[{"offerId":"o1","title":"Oil filter","unitPriceUsdMinor":"1250","brand":"Bosch","oem":"OEM1","qualityTier":"OEM","offerSource":"MARKETPLACE","supplierFormality":"formal","soldBy":"Bosch Agency"}]}"#
            )
        }
        let client = DialGatewayClient(baseUrl: "http://localhost:3000", cookies: store, transport: transport)
        let result = try client.searchSpare(q: "filter")
        XCTAssertEqual(result.currency, "USD")
        XCTAssertEqual(result.hits.count, 1)
        XCTAssertEqual(result.hits[0].unitPriceUsdMinor, 1250)
        XCTAssertEqual(result.hits[0].soldBy, "Bosch Agency")
    }

    func testCheckoutRejectsNonButtonChoice() {
        let client = DialGatewayClient(baseUrl: "http://localhost:3000")
        XCTAssertThrowsError(try client.checkoutSpare(offerId: "o1", choice: "paypal")) { err in
            XCTAssertEqual(err as? DialGatewayError, .invalidChoice)
        }
    }

    func testCheckoutEcoCashWithoutIdentityInBody() throws {
        let transport = MockTransport { method, url, headers, body, _ in
            XCTAssertEqual(method, "POST")
            XCTAssertTrue(url.hasSuffix("/api/spare/checkout"))
            XCTAssertFalse(headers["Idempotency-Key"]?.isEmpty ?? true)
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
                    body: #"{"q":"mealie","currency":"USD","liquorSkus":false,"hits":[{"offerId":"g1","title":"Mealie meal","unitPriceUsdMinor":"500","brand":"Ngwena","unitLabel":"2kg","coldChain":false,"offerSource":"MARKETPLACE","supplierFormality":"formal","supplierDisplayName":"OK Express Agency"}]}"#
                )
            }
            if method == "GET", url.contains("/api/grocery/track") {
                step += 1
                return HttpResponse(
                    statusCode: 200,
                    body: #"{"orderId":"gord_1","status":"confirmed","statusFrom":"erp","currency":"USD","totalUsdMinor":"500","payChoice":"cod","soldBy":"OK Express Agency","liquorAllowed":false}"#
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
        XCTAssertEqual(grocery.hits[0].supplierDisplayName, "OK Express Agency")
        let gTrack = try client.trackGrocery(orderId: "gord_1")
        XCTAssertEqual(gTrack.soldBy, "OK Express Agency")
        XCTAssertFalse(gTrack.liquorAllowed)
        XCTAssertEqual(step, 6)
    }

    func testPd21PromoReferralAndTechDeepLink() throws {
        var step = 0
        let transport = MockTransport { method, url, _, body, _ in
            if method == "POST", url.hasSuffix("/api/promo"), body!.contains("validate_code") {
                XCTAssertFalse(body!.contains("userId"))
                step += 1
                return HttpResponse(
                    statusCode: 200,
                    body: #"{"ok":true,"code":"SPARE10","draftDiscountPercent":10,"payableFromAi":false,"cashOutAllowed":false}"#
                )
            }
            if method == "POST", url.hasSuffix("/api/promo"), body!.contains("share_referral") {
                step += 1
                return HttpResponse(
                    statusCode: 200,
                    body: #"{"ok":true,"share":{"shareCode":"PD21-ALICE","shareUrl":"https://dial.zw/r/PD21-ALICE","cashOutAllowed":false,"rewardKind":"promo_credit"}}"#
                )
            }
            if method == "POST", url.hasSuffix("/api/promo"), body!.contains("attempt_cash_out") {
                step += 1
                return HttpResponse(
                    statusCode: 403,
                    body: #"{"ok":false,"error":"promo_credit_cash_out_forbidden","cashOutAllowed":false}"#
                )
            }
            if method == "GET", url.contains("/api/tech/services?view=slots") {
                step += 1
                return HttpResponse(
                    statusCode: 200,
                    body: #"{"slots":[{"id":"slot_1"}],"quote":{"source":"rate_card","draftAmountUsdMinor":"4500","payableFromAi":false}}"#
                )
            }
            if method == "POST", url.hasSuffix("/api/tech/services") {
                XCTAssertTrue(body!.contains(#""action":"book""#))
                XCTAssertFalse(body!.contains("userId"))
                step += 1
                return HttpResponse(
                    statusCode: 200,
                    body: #"{"ok":true,"job":{"id":"job_1","draftOnly":true,"payableFromAi":false},"quote":{"draftAmountUsdMinor":"4500","payableFromAi":false,"source":"rate_card"}}"#
                )
            }
            XCTFail("unexpected \(method) \(url)")
            return HttpResponse(statusCode: 500, body: "{}")
        }
        let client = DialGatewayClient(baseUrl: "http://localhost:3000", cookies: MemoryCookieStore(), transport: transport)
        let promo = try client.validatePromoCode(code: "SPARE10")
        XCTAssertTrue(promo.ok)
        XCTAssertFalse(promo.payableFromAi)
        XCTAssertFalse(promo.cashOutAllowed)
        let share = try client.shareReferral(campaignId: "pcamp_1", codeSuffix: "alice")
        XCTAssertEqual(share.shareCode, "PD21-ALICE")
        XCTAssertFalse(share.cashOutAllowed)
        XCTAssertFalse(try client.attemptPromoCashOut(amountMinor: 300))
        let slots = try client.techSlots()
        XCTAssertFalse(slots.payableFromAi)
        XCTAssertEqual(slots.quoteSource, "rate_card")
        let book = try client.bookTechGuide(slotId: slots.slotIds.first!)
        XCTAssertFalse(book.payableFromAi)
        XCTAssertTrue(book.draftOnly)
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
