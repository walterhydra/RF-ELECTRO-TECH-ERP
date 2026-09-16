# Android WebView App for ERP — Complete Technical Guide

This guide details the complete architecture, implementation strategy, AI prompt specifications, and release workflow for wrapping an existing ERP web application into a high-performance, native-feeling Android shell app.

---

## 1. The Core Idea

The ERP system is a fully functional web application. Instead of undertaking a complete native rewrite in Kotlin—which requires massive engineering effort and risks feature drift—the optimal strategy is:

> **Build a thin native Android "shell" application whose sole responsibility is to render the ERP web app inside a managed `WebView` while executing runtime enhancements to deliver a true mobile app experience.**

### Key Technical Principles:
- **Zero Server Code Changes:** The ERP's backend, HTML, CSS, and JavaScript stay 100% untouched on the server.
- **Runtime Client-Side Injections:** All mobile responsiveness fixes (meta viewports, layout overrides, touch target optimizations) are injected dynamically at runtime by the Android app via JavaScript/CSS into the DOM after page load.
- **Single Source of Truth:** A single web codebase continues to serve both desktop browser users and mobile app users seamlessly.

---

## 2. Project Structure

Keep the Android app project repository strictly separated from your web application codebase.

```text
MyERPWebsite/              <-- EXISTING ERP website repository (Do NOT touch)
    backend/
    frontend/

MyERPAndroidApp/           <-- NEW, separate Android Studio project
    ├── app/
    │   ├── build.gradle.kts
    │   └── src/
    │       └── main/
    │           ├── AndroidManifest.xml
    │           ├── java/com/company/erp/
    │           │   ├── MainActivity.kt
    │           │   └── SplashActivity.kt
    │           └── res/
    │               ├── layout/
    │               │   ├── activity_main.xml
    │               │   ├── activity_splash.xml
    │               │   └── layout_error.xml
    │               └── xml/
    │                   └── network_security_config.xml
    ├── build.gradle.kts
    └── settings.gradle.kts
```

> [!NOTE]
> **Project Setup:** Initialize as a brand-new project in Android Studio using the **Empty Views Activity** template (Kotlin, Minimum SDK 24+ recommended for modern WebView API coverage).

---

## 3. The Exact AI Implementation Prompt

When instructing AI agents (such as Antigravity) to generate the Android application, copy and use the exact prompt specification below:

```text
Do NOT modify anything inside the existing website/ERP folder. Create a brand-new, separate Android Studio project folder called MyERPAndroidApp at the same level (not inside the website folder).

Goal: A Kotlin Android app that loads my ERP (URL: https://your-erp-url.com) inside a WebView, and makes it feel and behave like a proper native mobile app — WITHOUT changing a single line of the website's own code. All mobile-responsiveness fixes must be injected by the Android app at runtime via JavaScript/CSS injection, never written back to the website files.

Build the following, fully working, nothing left as TODO/placeholder:

A. Manifest & permissions
- INTERNET, ACCESS_NETWORK_STATE
- CAMERA, READ_MEDIA_IMAGES (API 33+) / READ_EXTERNAL_STORAGE (below API 33) — needed because file upload fields in the ERP may want camera/gallery access
- usesCleartextTraffic="false" if the ERP is HTTPS (it should be); add a network_security_config.xml only if given an HTTP-only URL

B. MainActivity.kt
- A WebView filling the screen, wrapped in a SwipeRefreshLayout for pull-to-refresh
- WebSettings: javaScriptEnabled = true, domStorageEnabled = true, useWideViewPort = true, loadWithOverviewMode = true, builtInZoomControls = true, displayZoomControls = false, databaseEnabled = true, cacheMode = LOAD_DEFAULT
- CookieManager.getInstance().setAcceptCookie(true) and setAcceptThirdPartyCookies(webView, true) so login sessions persist properly between app launches
- Custom WebViewClient:
  * shouldOverrideUrlLoading: keep all navigation inside the WebView (don't open external browser) unless it's a tel:, mailto:, or external payment gateway link — those should open the appropriate external app
  * onPageFinished: inject mobile-responsive CSS/JS (see section D below)
  * onReceivedError / onReceivedHttpError: show a custom error/retry layout instead of a blank/broken page
- Custom WebChromeClient:
  * onShowFileChooser fully implemented (needed for file upload <input type='file'> fields in the ERP) — should let the user pick from gallery, files, or camera
  * onProgressChanged to drive a loading progress bar
- Hardware back button: override onBackPressedDispatcher — if webView.canGoBack() then webView.goBack(), else finish the activity
- A splash screen (activity_splash.xml + simple 1–1.5s delay or use Android 12+ SplashScreen API) before MainActivity loads

C. File chooser + permissions runtime handling
- Request CAMERA and media/storage permissions at runtime (not just in manifest) before opening the file picker, with proper permission-denied fallback (still allow file picker without camera if camera permission denied)

D. Mobile-responsive CSS/JS injection (the important part)
In onPageFinished, call webView.evaluateJavascript(...) with a script that:
1. Checks if a <meta name='viewport'> tag exists; if not, creates and appends one with content='width=device-width, initial-scale=1.0, maximum-scale=1.0'
2. Creates a <style id='mobile-override'> tag (check it doesn't already exist, to avoid duplicate injection on page reload) and appends it to <head>, containing responsive overrides wrapped in @media (max-width: 768px) { ... }:
   - Force fixed-width containers/tables to max-width: 100% and overflow-x: auto
   - Sidebars/nav menus: hide by default, add a hamburger-style toggle (inject a small floating button + JS click handler to toggle a CSS class)
   - Increase touch target sizes: button, input, select, a { min-height: 44px; }
   - Adjust base font-size for readability
   - Make images/tables scroll horizontally inside a wrapper rather than overflowing the screen
3. Add a MutationObserver fallback that re-checks and re-injects the style tag if it is ever removed by SPA navigation or dynamic JS updates.

E. Error handling
- If there's no internet connection or page fails to load: show a friendly full-screen message with a "Retry" button rather than a blank browser error screen.

F. Build files
- Complete build.gradle.kts (app + project level) with all required dependencies (SwipeRefreshLayout, core-ktx, appcompat, material).
- targetSdkVersion/compileSdkVersion set to latest stable.
```

---

## 4. Architectural Feature Justification

| Feature | Technical Purpose & Value |
| :--- | :--- |
| **Viewport Injection** | Prevents desktop rendering mode where text/elements shrink to unreadable scales on mobile screens. |
| **CSS Override Injection** | Prevents desktop tables, absolute sidebars, and fixed-width forms from overflowing the mobile screen boundaries. |
| **MutationObserver Re-injection** | Essential for Single Page Applications (SPAs). Re-applies custom styles when client-side routing re-renders parts of the DOM. |
| **Cookie Persistence** | Configures `CookieManager` so user session tokens/cookies persist reliably across app restarts. |
| **`onShowFileChooser` Implementation** | Enables native file selection dialogs (Gallery, Camera, Files) when tapping `<input type="file">` elements. |
| **Hardware Back Button Handling** | Traps back key events to navigate WebView browser history instead of terminating the app context unexpectedly. |
| **Custom Error & Offline Screen** | Eliminates native browser `net::ERR_INTERNET_DISCONNECTED` blank error pages, replacing them with a branded retry view. |
| **Runtime Permissions** | Satisfies Android 6.0+ security rules for Camera and Storage access during file upload flows. |

---

## 5. Developer Verification & Sanity Checkpoints

> [!IMPORTANT]
> **Pre-Flight Inspection Checklist:**
> 1. **HTTPS Protocol:** The ERP endpoint must be served over valid HTTPS. Plain HTTP triggers cleartext traffic blocking unless explicitly bypassed.
> 2. **Session Persistence:** Log into the app, force-close it, and relaunch to verify persistent session cookies.
> 3. **Native File Upload:** Test uploading documents/images directly through `<input type="file">` fields to ensure `onShowFileChooser` activates the native picker.
> 4. **Physical Device Testing:** Test touch dynamics and gestures on physical hardware rather than solely on emulators.
> 5. **Desktop Interaction Fallbacks:** Ensure hover-only dropdowns or right-click context menus are accessible via tap or touch equivalents.

---

## 6. Comprehensive Testing Checklist

- [ ] **App Launch & Splash:** App launches smoothly, displays splash screen, and transitions into `MainActivity`.
- [ ] **Viewport & Scaling:** Viewport initializes correctly without forced zoom-out or microscopic text.
- [ ] **Navigation & Layout:** Mobile hamburger toggle successfully expands/collapses side navigation menus.
- [ ] **Horizontal Overflow:** Tables and wide data grids scroll smoothly horizontally within native bounds.
- [ ] **Touch Targets:** All interactive elements (buttons, inputs, select boxes) meet min 44px touch targets.
- [ ] **Session Persistence:** Sessions remain active after quitting and reopening the app.
- [ ] **File Chooser & Camera:** File upload input prompts native Android file picker and camera options seamlessly.
- [ ] **Hardware Back Button:** Back button navigates back in WebView history until root page is reached.
- [ ] **Offline Handling:** Disabling Wi-Fi/Cellular triggers custom offline retry layout.
- [ ] **Pull to Refresh:** Swipe down gesture reloads current WebView URL without breaking state.
- [ ] **Orientation Handling:** Screen rotation preserves layout stability without destroying WebView state.

---

## 7. Building the Production Release APK

Once manual and automated tests are passed:

1. Open the project in **Android Studio**.
2. Select **Build > Generate Signed Bundle / APK...**
3. Select **APK** (or Android App Bundle `.aab` for Google Play Store upload) and click **Next**.
4. Select an existing **Keystore** or click **Create new...** to create a signing key.
5. Enter the key alias and password details.
6. Select the **release** build variant and check **V1 (JAR Signature)** and **V2 (Full APK Signature)** if prompted.
7. Click **Create**. The generated release APK will be saved in `app/release/app-release.apk`.
