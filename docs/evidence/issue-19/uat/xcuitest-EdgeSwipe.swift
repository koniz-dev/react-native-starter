import XCTest

/// Performs a left-edge swipe-back in the app named by TARGET_BUNDLE (default Expo Go).
final class EdgeSwipe: XCTestCase {
  func testEdgeSwipeBack() {
    let env = ProcessInfo.processInfo.environment
    let app = XCUIApplication(bundleIdentifier: env["TARGET_BUNDLE"] ?? "host.exp.Exponent")
    app.activate()
    sleep(1)
    let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.0, dy: 0.5))
    let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.85, dy: 0.5))
    start.press(forDuration: 0.1, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.1)
    sleep(1)
  }
}
