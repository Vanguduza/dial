import SwiftUI
import DialCustomerCore

/// PD20 Spare + Grocery mobile deepen — tunacosgun/eCommerce patterns; DIAL gateway SoR.
/// Brand tokens from packages/design-tokens (#0B3D2E / #C4A35A / #F7F4EF).

@main
struct DialCustomerApp: App {
    var body: some Scene {
        WindowGroup {
            RootView(baseUrl: ProcessInfo.processInfo.environment["DIAL_GATEWAY_BASE_URL"] ?? "http://127.0.0.1:3000")
        }
    }
}

private enum Tab: String, CaseIterable {
    case spare = "Spare"
    case orders = "Orders"
    case garage = "Garage"
    case grocery = "Grocery"
}

struct RootView: View {
    let baseUrl: String
    @State private var client: DialGatewayClient
    @State private var signedIn = false
    @State private var sessionUserId = ""
    @State private var email = ""
    @State private var password = ""
    @State private var tab: Tab = .spare
    @State private var hits: [SpareOfferHit] = []
    @State private var groceryHits: [GroceryOfferHit] = []
    @State private var orders: [SpareOrderSummary] = []
    @State private var vehicles: [GarageVehicle] = []
    @State private var selected: SpareOfferHit?
    @State private var grocerySelected: GroceryOfferHit?
    @State private var status = ""
    @State private var error: String?
    @State private var busy = false
    @State private var garageLabel = ""
    @State private var garageChassis = ""
    @State private var garageConsent = false

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
                } else if let grocerySelected {
                    groceryCheckoutView(offer: grocerySelected)
                } else {
                    VStack(alignment: .leading, spacing: 8) {
                        Picker("Tab", selection: $tab) {
                            ForEach(Tab.allCases, id: \.self) { t in
                                Text(t.rawValue).tag(t)
                            }
                        }
                        .pickerStyle(.segmented)
                        .onChange(of: tab) { _, new in
                            loadTab(new)
                        }
                        switch tab {
                        case .spare: browseView
                        case .orders: ordersView
                        case .garage: garageView
                        case .grocery: groceryBrowseView
                        }
                    }
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
            Text("SwiftUI · PD20 · USD · EcoCash | COD · no Expo")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            TextField("Email", text: $email)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
            SecureField("Password", text: $password)
            Button("Sign in") {
                run {
                    let sess = try client.signIn(email: email.trimmingCharacters(in: .whitespaces), password: password)
                    sessionUserId = sess.userId
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
            Text("PD20 · orders/returns/garage parity · MARKETPLACE agency")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private var ordersView: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Orders (USD)").font(.title2.bold())
            List(orders) { o in
                VStack(alignment: .leading) {
                    Text(o.orderId).font(.headline)
                    Text("\(o.status) · Sold by \(o.soldBySummary)")
                    Text(String(format: "USD %.2f · %@", Double(o.totalUsdMinor) / 100, o.payChoice))
                    Button("Track + open return") {
                        run {
                            let track = try client.trackSpareOrder(orderId: o.orderId)
                            precondition(track.zigOnTrack == false)
                            let claim = try client.openSpareReturn(orderId: o.orderId)
                            precondition(claim.payableFromAi == false)
                            status = "Return \(claim.claimId) · payableFromAi=false"
                        }
                    }
                }
            }
            .listStyle(.plain)
            if !status.isEmpty { Text(status).font(.footnote) }
            if let error { Text(error).foregroundStyle(.red) }
        }
    }

    private var garageView: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Garage").font(.title2.bold())
            Text("Reminders need consent.").font(.caption).foregroundStyle(.secondary)
            TextField("Label", text: $garageLabel)
            TextField("Chassis", text: $garageChassis)
            Toggle("Reminder consent", isOn: $garageConsent)
            Button("Add vehicle") {
                run {
                    _ = try client.addGarageVehicle(
                        customerId: sessionUserId,
                        label: garageLabel,
                        chassisHint: garageChassis,
                        reminderConsent: garageConsent
                    )
                    vehicles = try client.listGarageVehicles(customerId: sessionUserId)
                    garageLabel = ""
                    garageChassis = ""
                }
            }
            .buttonStyle(.borderedProminent)
            List(vehicles) { v in
                Text("\(v.label) · \(v.chassisHint) · consent=\(v.reminderConsent)")
            }
            .listStyle(.plain)
            if let error { Text(error).foregroundStyle(.red) }
        }
    }

    private var groceryBrowseView: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Grocery · USD · food").font(.title2.bold())
            Text("No liquor").font(.caption).foregroundStyle(.secondary)
            List(groceryHits) { offer in
                Button {
                    grocerySelected = offer
                } label: {
                    VStack(alignment: .leading) {
                        Text(offer.title).font(.headline)
                        Text("\(offer.brand) · \(offer.unitLabel)")
                        Text(String(format: "USD %.2f", Double(offer.unitPriceUsdMinor) / 100))
                    }
                }
            }
            .listStyle(.plain)
            if let error { Text(error).foregroundStyle(.red) }
        }
    }

    private func checkoutView(offer: SpareOfferHit) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Button("← Browse") { selected = nil }
            Text("Cart (USD)").font(.title2.bold())
            Text(offer.title).fontWeight(.semibold)
            Text(String(format: "USD %.2f · qty 1", Double(offer.unitPriceUsdMinor) / 100))
            Text("ZiG only at pay (D-57). Then ERP order + return.")
                .font(.caption)
                .foregroundStyle(.secondary)
            Button("Pay EcoCash") { paySpare(offer: offer, choice: "ecocash") }
                .buttonStyle(.borderedProminent)
                .tint(Color(red: 196 / 255, green: 163 / 255, blue: 90 / 255))
            Button("Cash on delivery (USD)") { paySpare(offer: offer, choice: "cod") }
                .buttonStyle(.bordered)
            if !status.isEmpty { Text(status).font(.footnote) }
            if let error { Text(error).foregroundStyle(.red) }
            if busy { ProgressView() }
        }
    }

    private func groceryCheckoutView(offer: GroceryOfferHit) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Button("← Grocery") { grocerySelected = nil }
            Text("Grocery cart (USD)").font(.title2.bold())
            Text(offer.title)
            Button("Pay EcoCash") {
                run {
                    let result = try client.checkoutGrocery(offerId: offer.offerId, choice: "ecocash")
                    status = "Grocery EcoCash · \(result.currency) \(result.cartTotalUsdMinor)"
                    grocerySelected = nil
                    tab = .grocery
                }
            }
            .buttonStyle(.borderedProminent)
            Button("Cash on delivery (USD)") {
                run {
                    _ = try client.checkoutGrocery(offerId: offer.offerId, choice: "cod")
                    grocerySelected = nil
                }
            }
            .buttonStyle(.bordered)
            if let error { Text(error).foregroundStyle(.red) }
        }
    }

    private func paySpare(offer: SpareOfferHit, choice: String) {
        run {
            let checkout = try client.checkoutSpare(offerId: offer.offerId, choice: choice)
            var note = "\(choice) \(checkout.intentId ?? "") · \(checkout.soldBy ?? "")"
            if let cartId = checkout.cartId {
                let order = try client.placeSpareOrder(cartId: cartId, payChoice: choice, customerId: sessionUserId)
                let track = try client.trackSpareOrder(orderId: order.orderId)
                precondition(track.zigOnTrack == false)
                let claim = try client.openSpareReturn(orderId: order.orderId)
                precondition(claim.payableFromAi == false)
                note += " · order \(order.orderId) · return \(claim.claimId)"
            }
            status = note
            selected = nil
            tab = .orders
            orders = try client.listSpareOrders(customerId: sessionUserId)
        }
    }

    private func loadTab(_ tab: Tab) {
        run {
            switch tab {
            case .spare:
                let result = try client.searchSpare()
                hits = result.hits
            case .orders:
                orders = try client.listSpareOrders(customerId: sessionUserId)
            case .garage:
                vehicles = try client.listGarageVehicles(customerId: sessionUserId)
            case .grocery:
                let g = try client.searchGrocery()
                guard g.currency == "USD", g.liquorSkus == false else {
                    throw DialGatewayError.http(status: 0, message: "Grocery must be USD without liquor")
                }
                groceryHits = g.hits
            }
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
