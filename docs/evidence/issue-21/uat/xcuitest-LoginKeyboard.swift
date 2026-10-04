import XCTest

/// Drives the login form with the software keyboard in Expo Go (TARGET_BUNDLE).
/// The app must already show the Login screen. Screenshots go to SHOT_DIR.
final class LoginKeyboard: XCTestCase {
  func shot(_ name: String) {
    guard let dir = ProcessInfo.processInfo.environment["SHOT_DIR"] else { return }
    let png = XCUIScreen.main.screenshot().pngRepresentation
    try? png.write(to: URL(fileURLWithPath: dir).appendingPathComponent("\(name).png"))
  }

  func testReturnKeysAndSignInReachable() {
    let env = ProcessInfo.processInfo.environment
    let app = XCUIApplication(bundleIdentifier: env["TARGET_BUNDLE"] ?? "host.exp.Exponent")
    app.activate()

    let username = app.textFields.firstMatch
    XCTAssertTrue(username.waitForExistence(timeout: 10), "username field")
    username.tap()
    let keyboard = app.keyboards.firstMatch
    XCTAssertTrue(keyboard.waitForExistence(timeout: 5), "software keyboard shown")

    let signIn = app.buttons["Sign In"].exists ? app.buttons["Sign In"] : app.staticTexts["Sign In"]
    XCTAssertTrue(signIn.exists, "Sign In exists")
    XCTAssertLessThanOrEqual(signIn.frame.maxY, keyboard.frame.minY, "Sign In above keyboard (username focused)")
    shot("ios-kb-01-username-focused")

    // Type key by key on the software keyboard, like a user; bulk typeText
    // outpaces the controlled input in a dev build and drops characters
    // (also on the pre-fix screen).
    for ch in "emilys" { keyboard.keys[String(ch)].tap() }
    print("DIAG username after typeText:", String(describing: username.value))
    XCTAssertEqual(username.value as? String, "emilys", "username typed")
    keyboard.buttons["next"].tap()

    let password = app.secureTextFields.firstMatch
    XCTAssertTrue(password.waitForExistence(timeout: 5), "password field")
    XCTAssertTrue(keyboard.exists, "keyboard still shown after next")
    XCTAssertEqual(password.value(forKey: "hasKeyboardFocus") as? Bool, true, "next moved focus to password")
    XCTAssertLessThanOrEqual(signIn.frame.maxY, keyboard.frame.minY, "Sign In above keyboard (password focused)")
    shot("ios-kb-02-password-focused")

    for ch in "emilyspass" { keyboard.keys[String(ch)].tap() }
    XCTAssertEqual((password.value as? String)?.count, 10, "password entered")
    let go = keyboard.buttons["go"].exists ? keyboard.buttons["go"] : keyboard.buttons["Go"]
    go.tap()

    XCTAssertTrue(app.staticTexts["React Native Paper"].waitForExistence(timeout: 20), "go signed in and returned Home")
    shot("ios-kb-03-signed-in-home")
  }
}
