// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "DialCustomer",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(name: "DialCustomerCore", targets: ["DialCustomerCore"]),
    ],
    targets: [
        .target(
            name: "DialCustomerCore",
            path: "Sources/DialCustomerCore"
        ),
        .testTarget(
            name: "DialCustomerCoreTests",
            dependencies: ["DialCustomerCore"],
            path: "Tests/DialCustomerCoreTests"
        ),
    ]
)
