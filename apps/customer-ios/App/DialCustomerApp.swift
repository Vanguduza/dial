import SwiftUI
import DialCustomerCore

/// PD8 Spare storefront shell — tunacosgun/eCommerce patterns; DIAL gateway SoR.
/// Brand tokens from packages/design-tokens (#0B3D2E / #C4A35A / #F7F4EF).

@main
struct DialCustomerApp: App {
    var body: some Scene {
        WindowGroup {
            RootView(baseUrl: ProcessInfo.processInfo.environment["DIAL_GATEWAY_BASE_URL"] ?? "http://127.0.0.1:3000")
        }
    }
}

struct RootView: View {
    let baseUrl: String
    @State private var client: DialGatewayClient
    @State private var signedIn = false
    @State private var email = ""
    @State private var password = ""
    @State private var hits: [SpareOfferHit] = []
    @State private var selected: SpareOfferHit?
    @State private var status = ""
    @State private var error: String?
    @State private var busy = false

    init(baseUrl: String) {
        self.baseUrl = baseUrl
        _client = State(initialValue: DialGatewayClient(baseUrl: baseUrl))
    }

    var body: some View {
        NavigationStack {
            Group {
                if !signedIn {
                    signInForm
                } else if let selected {
                    checkoutView(offer: selected)
                } else {
                    browseView
                }
            }
            .padding()
            .background(Color(red: 247 / 255, green: 244 / 255, blue: 239 / 255).ignoresSafeArea())
            .navigationTitle("DIAL")
        }
    }

    private var signInForm: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Dial a Spare")
                .font(.largeTitle.bold())
                .foregroundStyle(Color(red: 11 / 255, green: 61 / 255, blue: 46 / 255))
            Text("SwiftUI · USD browse · EcoCash | COD")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            TextField("Email", text: $email)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
            SecureField("Password", text: $password)
            Button("Sign in") {
                run {
                    _ = try client.signIn(email: email.trimmingCharacters(in: .whitespaces), password: password)
                    signedIn = true
                    let result = try client.searchSpare()
                    guard result.currency == "USD" else {
                        throw DialGatewayError.http(status: 0, message: "Browse must be USD (D-57)")
                    }
                    hits = result.hits
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(Color(red: 11 / 255, green: 61 / 255, blue: 46 / 255))
            if let error { Text(error).foregroundStyle(.red) }
            if busy { ProgressView() }
        }
    }

    private var browseView: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Spare · USD")
                .font(.title2.bold())
                .foregroundStyle(Color(red: 11 / 255, green: 61 / 255, blue: 46 / 255))
            List(hits) { offer in
                Button {
                    selected = offer
                } label: {
                    VStack(alignment: .leading) {
                        Text(offer.title).font(.headline)
                        Text("\(offer.brand) · \(offer.qualityTier)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(String(format: "USD %.2f", Double(offer.unitPriceUsdMinor) / 100))
                            .fontWeight(.semibold)
                    }
                }
            }
            .listStyle(.plain)
            if let error { Text(error).foregroundStyle(.red) }
            Text("PD8 · no Expo · MARKETPLACE agency")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private func checkoutView(offer: SpareOfferHit) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Button("← Browse") { selected = nil }
            Text("Cart (USD)").font(.title2.bold())
            Text(offer.title).fontWeight(.semibold)
            Text(String(format: "USD %.2f · qty 1", Double(offer.unitPriceUsdMinor) / 100))
            Text("ZiG only at pay (D-57). IMTT not on lines.")
                .font(.caption)
                .foregroundStyle(.secondary)
            Button("Pay EcoCash") {
                run {
                    let result = try client.checkoutSpare(offerId: offer.offerId, choice: "ecocash")
                    status = "EcoCash \(result.intentId ?? "") · fx \(result.fxRateId ?? "") · \(result.soldBy ?? "")"
                    selected = nil
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(Color(red: 196 / 255, green: 163 / 255, blue: 90 / 255))
            Button("Cash on delivery (USD)") {
                run {
                    let result = try client.checkoutSpare(offerId: offer.offerId, choice: "cod")
                    status = "COD ok · \(result.currency) \(result.cartTotalUsdMinor)"
                    selected = nil
                }
            }
            .buttonStyle(.bordered)
            if !status.isEmpty { Text(status).font(.footnote) }
            if let error { Text(error).foregroundStyle(.red) }
            if busy { ProgressView() }
        }
    }

    private func run(_ block: @escaping () throws -> Void) {
        busy = true
        error = nil
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                try block()
                DispatchQueue.main.async { busy = false }
            } catch {
                DispatchQueue.main.async {
                    self.error = String(describing: error)
                    busy = false
                }
            }
        }
    }
}
