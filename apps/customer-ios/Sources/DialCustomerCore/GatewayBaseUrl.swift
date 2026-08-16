import Foundation

/**
 Phase 3 prep (not G3) — resolve staging/local gateway base URL (key-drop-in).
 Priority: process env → Info.plist `DialGatewayBaseURL` → localhost default.
 Never invent production hosts; ops fills staging URL when ENH-011 / vault ready.
 */
public enum GatewayBaseUrl {
    public static let infoPlistKey = "DialGatewayBaseURL"
    public static let envKey = "DIAL_GATEWAY_BASE_URL"
    public static let localDefault = "http://127.0.0.1:3000"

    public static func resolve(
        env: [String: String] = ProcessInfo.processInfo.environment,
        bundle: Bundle = .main,
    ) -> String {
        if let fromEnv = env[envKey]?.trimmingCharacters(in: .whitespacesAndNewlines),
           !fromEnv.isEmpty
        {
            return fromEnv
        }
        if let fromPlist = bundle.object(forInfoDictionaryKey: infoPlistKey) as? String {
            let trimmed = fromPlist.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty {
                return trimmed
            }
        }
        return localDefault
    }

    /// True when URL is emulator/simulator loopback — valid for local flavor, not G3 staging.
    public static func isLoopback(_ url: String) -> Bool {
        let lower = url.lowercased()
        return lower.contains("127.0.0.1")
            || lower.contains("localhost")
            || lower.contains("10.0.2.2")
            || lower.contains("[::1]")
    }

    /**
     Internal-track / TestFlight: require non-empty non-loopback URL (ops staging).
     Simulator keeps `resolve()` + localhost default. Nil = fail-closed, not G3.
     */
    public static func resolveForInternalTrack(
        env: [String: String] = ProcessInfo.processInfo.environment,
        bundle: Bundle = .main,
    ) -> String? {
        let url = resolve(env: env, bundle: bundle)
        if url.isEmpty || isLoopback(url) {
            return nil
        }
        return url
    }
}
