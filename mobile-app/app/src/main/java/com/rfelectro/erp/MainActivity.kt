package com.rfelectro.erp

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.View
import android.webkit.*
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import com.google.android.material.button.MaterialButton
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefreshLayout: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var layoutError: View
    private lateinit var btnRetry: MaterialButton

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var cameraImageUri: Uri? = null

    private lateinit var permissionLauncher: ActivityResultLauncher<Array<String>>
    private lateinit var fileChooserLauncher: ActivityResultLauncher<Intent>

    companion object {
        const val ERP_TARGET_URL = "https://rfgenix.com/"
        const val MOBILE_CSS_OVERRIDE_ID = "mobile-override-style"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        setupLaunchers()
        setupBackNavigation()
        setupWebView()

        if (isNetworkAvailable()) {
            webView.loadUrl(ERP_TARGET_URL)
        } else {
            showErrorLayout(true)
        }
    }

    private fun initViews() {
        webView = findViewById(R.id.webView)
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)
        progressBar = findViewById(R.id.progressBar)
        layoutError = findViewById(R.id.layoutError)
        btnRetry = findViewById(R.id.btnRetry)

        swipeRefreshLayout.setColorSchemeResources(R.color.accent, R.color.primary)
        // Disable SwipeRefreshLayout gesture interception so WebView handles bidirectional scrolling (up/down) seamlessly
        swipeRefreshLayout.isEnabled = false

        btnRetry.setOnClickListener {
            if (isNetworkAvailable()) {
                showErrorLayout(false)
                webView.clearCache(true)
                webView.loadUrl(webView.url ?: ERP_TARGET_URL)
            } else {
                Toast.makeText(this, "No internet connection detected.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (layoutError.visibility == View.VISIBLE) {
                    finish()
                } else if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.builtInZoomControls = true
        settings.displayZoomControls = false
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mediaPlaybackRequiresUserGesture = false

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.safeBrowsingEnabled = true
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false

                if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:") || url.startsWith("sms:")) {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        return true
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "No application found to handle link", Toast.LENGTH_SHORT).show()
                        return true
                    }
                }

                if (url.contains("rfgenix.com") || url.contains("rf-electrotech.vercel.app") || url.contains("vercel.app")) {
                    return false
                }

                try {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    return true
                } catch (e: Exception) {
                    return false
                }
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
                showErrorLayout(false)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                swipeRefreshLayout.isRefreshing = false
                cookieManager.flush()

                injectMobileOptimizations()
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    progressBar.visibility = View.GONE
                    swipeRefreshLayout.isRefreshing = false
                    showErrorLayout(true)
                }
            }

            override fun onReceivedHttpError(view: WebView?, request: WebResourceRequest?, errorResponse: WebResourceResponse?) {
                super.onReceivedHttpError(view, request, errorResponse)
                if (request?.isForMainFrame == true && (errorResponse?.statusCode ?: 0) >= 500) {
                    progressBar.visibility = View.GONE
                    swipeRefreshLayout.isRefreshing = false
                    showErrorLayout(true)
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                } else {
                    progressBar.visibility = View.VISIBLE
                    progressBar.progress = newProgress
                }
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                runOnUiThread {
                    try {
                        request?.grant(request.resources)
                    } catch (e: Exception) {
                        super.onPermissionRequest(request)
                    }
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                checkAndRequestPickerPermissions()
                return true
            }
        }
    }

    private fun injectMobileOptimizations() {
        val jsScript = """
            (function() {
                function applyOptimizations() {
                    // 1. Viewport Meta Tag Setup
                    var meta = document.querySelector('meta[name="viewport"]');
                    if (!meta) {
                        meta = document.createElement('meta');
                        meta.name = 'viewport';
                        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no';
                        document.getElementsByTagName('head')[0].appendChild(meta);
                    }

                    // 2. Sidebar Identification (Indicative of Logged In state)
                    var sidebar = document.querySelector('aside') || document.querySelector('[class*="w-64"]');
                    
                    // 3. Inject CSS overrides
                    var styleId = '$MOBILE_CSS_OVERRIDE_ID';
                    var existingStyle = document.getElementById(styleId);
                    var cssRules = `
                        @media (max-width: 768px) {
                            html, body {
                                max-width: 100vw !important;
                                overflow-x: hidden !important;
                                -webkit-tap-highlight-color: transparent;
                            }

                            /* Hide overlapping or unnecessary elements in the navbar */
                            header input, 
                            header div.relative.max-w-2xl,
                            header button[aria-label*="menu"],
                            header svg.lucide-menu { 
                                display: none !important; 
                            }

                            /* Ensure top header remains a clean single row */
                            header {
                                height: 60px !important;
                                min-height: 60px !important;
                                padding-left: 55px !important; /* Make room for dots icon */
                                position: sticky !important;
                                top: 0 !important;
                                z-index: 40 !important;
                                background: #ffffff !important;
                                display: flex !important;
                                align-items: center !important;
                                border-bottom: 1px solid #e2e8f0 !important;
                            }

                            /* Sidebar Mobile Drawer - restricted to ~65% width */
                            aside, [class*="w-64"] {
                                position: fixed !important;
                                top: 0 !important;
                                left: 0 !important;
                                height: 100vh !important;
                                width: 65vw !important; 
                                max-width: 320px !important;
                                z-index: 100000 !important;
                                transform: translateX(-100%) !important;
                                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                                box-shadow: 4px 0 25px rgba(0,0,0,0.5) !important;
                                background: #0F172A !important;
                                overflow-y: auto !important;
                                display: block !important;
                            }
                            aside.mobile-drawer-open, [class*="w-64"].mobile-drawer-open {
                                transform: translateX(0) !important;
                            }

                            /* Backdrop Overlay */
                            #mobile-sidebar-backdrop {
                                position: fixed;
                                top: 0;
                                left: 0;
                                width: 100vw;
                                height: 100vh;
                                background: rgba(0, 0, 0, 0.45);
                                z-index: 99999;
                                display: none;
                                backdrop-filter: blur(1px);
                            }
                            #mobile-sidebar-backdrop.active {
                                display: block !important;
                            }

                            /* Main Content Area adjustments & Smooth Bidirectional Touch Scrolling */
                            main, .flex-1, div.flex-1 {
                                width: 100% !important;
                                max-width: 100vw !important;
                                margin-left: 0 !important;
                                -webkit-overflow-scrolling: touch !important;
                                overscroll-behavior-y: contain !important;
                                touch-action: auto !important;
                            }

                            /* Recharts Responsive Horizontal Scrolling & Non-overlapping Labels on Mobile */
                            .recharts-scroll-container,
                            div:has(> .recharts-responsive-container) {
                                overflow-x: auto !important;
                                overflow-y: hidden !important;
                                -webkit-overflow-scrolling: touch !important;
                                max-width: 100% !important;
                                touch-action: pan-x pan-y !important;
                                padding-bottom: 14px !important;
                                scrollbar-width: thin !important;
                            }

                            .recharts-responsive-container {
                                min-width: 840px !important;
                            }

                            .recharts-surface, .recharts-wrapper {
                                overflow: visible !important;
                            }

                            .recharts-cartesian-axis-tick text {
                                font-size: 11px !important;
                                font-weight: 500 !important;
                            }

                            /* Hide ERP Login / Dashboard button from landing page top navbar in mobile app */
                            nav.absolute a[href*="login"],
                            nav.absolute a[href*="dashboard"] {
                                display: none !important;
                            }

                            /* Hide floating scroll-to-top arrow button on landing page in mobile app */
                            button:has(svg.lucide-arrow-up),
                            div:has(> button svg.lucide-arrow-up),
                            div.fixed:has(button.bg-blue-400) {
                                display: none !important;
                            }

                            /* Hide Job Cards workflow badge, green LIVE badge, and subtitle in mobile app */
                            div:has(> h1) span:has(span.bg-emerald-500),
                            div:has(> h1) span.bg-emerald-50,
                            div:has(> h1) span.bg-slate-100.text-slate-700,
                            div:has(> div > h1) > p.text-slate-500 {
                                display: none !important;
                            }

                            /* Proper arrangement for Job Cards quick action buttons on mobile */
                            div:has(> a[href*="/job-cards/launch"]) {
                                display: grid !important;
                                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                                gap: 8px !important;
                                width: 100% !important;
                            }
                            div:has(> a[href*="/job-cards/launch"]) > button,
                            div:has(> a[href*="/job-cards/launch"]) > a {
                                width: 100% !important;
                                justify-content: center !important;
                            }
                            div:has(> a[href*="/job-cards/launch"]) > button:last-child {
                                grid-column: span 2 / span 2 !important;
                            }

                            /* Section Switcher Tabs on mobile: side-by-side 2-col segmented control */
                            div:has(> button:has(svg.lucide-factory)) {
                                display: grid !important;
                                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                                gap: 6px !important;
                                width: 100% !important;
                            }
                            div:has(> button:has(svg.lucide-factory)) > button {
                                width: 100% !important;
                                justify-content: center !important;
                                padding-left: 8px !important;
                                padding-right: 8px !important;
                            }

                            /* 2x2 Grid for Job Cards KPI metric boxes on mobile */
                            div:has(> div:has(> form input[placeholder*="Scan"])) {
                                display: grid !important;
                                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                                gap: 10px !important;
                                width: 100% !important;
                            }
                            div:has(> form input[placeholder*="Scan"]) {
                                grid-column: span 2 / span 2 !important;
                            }
                            div:has(> div:has(> form input[placeholder*="Scan"])) > div:not(:has(form)) {
                                padding: 12px !important;
                                min-height: auto !important;
                                display: flex !important;
                                flex-direction: column !important;
                                justify-content: space-between !important;
                                gap: 6px !important;
                            }

                            /* Top 3 WIP Stages & Analytics widgets mobile polish */
                            div:has(> div > div > h3) {
                                padding: 12px !important;
                                border-radius: 16px !important;
                                font-family: 'Quicksand', sans-serif !important;
                            }
                            div:has(> div > div > h3) * {
                                font-family: 'Quicksand', sans-serif !important;
                            }
                            div:has(> div > div > h3) > div:first-child > span:last-child {
                                white-space: nowrap !important;
                                font-size: 11px !important;
                                padding: 2px 8px !important;
                                flex-shrink: 0 !important;
                            }
                            div:has(> div > div > h3) > div:first-child p {
                                display: none !important;
                            }
                            div:has(> div > div > h3) .bg-slate-800 {
                                background: linear-gradient(90deg, #3b82f6, #1d4ed8) !important;
                                border-radius: 9999px !important;
                            }
                        }
                    `;
                    if (!existingStyle) {
                        var style = document.createElement('style');
                        style.id = styleId;
                        style.innerHTML = cssRules;
                        document.head.appendChild(style);
                    } else if (existingStyle.innerHTML !== cssRules) {
                        existingStyle.innerHTML = cssRules;
                    }

                    // 4. Backdrop Injection
                    var backdrop = document.getElementById('mobile-sidebar-backdrop');
                    if (!backdrop) {
                        backdrop = document.createElement('div');
                        backdrop.id = 'mobile-sidebar-backdrop';
                        document.body.appendChild(backdrop);
                        backdrop.onclick = function() {
                            var currentSidebar = document.querySelector('aside') || document.querySelector('[class*="w-64"]');
                            if (currentSidebar) currentSidebar.classList.remove('mobile-drawer-open');
                            backdrop.classList.remove('active');
                        };
                    }

                    // 5. Menu Button (Three Lines ☰) Injection - Integrated into Navbar
                    var existingBtn = document.getElementById('mobile-hamburger-btn');
                    if (sidebar) {
                        if (!existingBtn) {
                            var btn = document.createElement('button');
                            btn.id = 'mobile-hamburger-btn';
                            btn.innerHTML = '&#9776;'; // Hamburger Menu ☰
                            btn.style.cssText = 'position:fixed;top:0px;left:0px;height:60px;width:55px;z-index:100001;background:transparent;color:#64748b;border:none;font-size:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;';
                            btn.onclick = function(e) {
                                e.stopPropagation();
                                var currentSidebar = document.querySelector('aside') || document.querySelector('[class*="w-64"]');
                                var currentBackdrop = document.getElementById('mobile-sidebar-backdrop');
                                if (currentSidebar) {
                                    var isOpen = currentSidebar.classList.contains('mobile-drawer-open');
                                    if (isOpen) {
                                        currentSidebar.classList.remove('mobile-drawer-open');
                                        if (currentBackdrop) currentBackdrop.classList.remove('active');
                                    } else {
                                        currentSidebar.classList.add('mobile-drawer-open');
                                        if (currentBackdrop) currentBackdrop.classList.add('active');
                                    }
                                }
                            };
                            document.body.appendChild(btn);
                        }

                        // 6. Auto-close logic: Close menu when a link inside the sidebar is clicked
                        if (!sidebar.__autoCloseBound) {
                            sidebar.__autoCloseBound = true;
                            sidebar.addEventListener('click', function(e) {
                                var target = e.target;
                                while (target && target !== sidebar) {
                                    if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.getAttribute('role') === 'menuitem') {
                                        setTimeout(function() {
                                            sidebar.classList.remove('mobile-drawer-open');
                                            var currentBackdrop = document.getElementById('mobile-sidebar-backdrop');
                                            if (currentBackdrop) currentBackdrop.classList.remove('active');
                                        }, 200); 
                                        break;
                                    }
                                    target = target.parentElement;
                                }
                            });
                        }
                    } else if (existingBtn) {
                        existingBtn.remove();
                    }

                    // 7. Chart horizontal scrolling & non-overlapping spacing optimization
                    var charts = document.querySelectorAll('.recharts-responsive-container');
                    var chartNeedsResize = false;
                    charts.forEach(function(chart) {
                        var parent = chart.parentElement;
                        if (parent) {
                            if (!parent.classList.contains('recharts-scroll-container')) {
                                parent.classList.add('recharts-scroll-container');
                            }
                            parent.style.setProperty('overflow-x', 'auto', 'important');
                            parent.style.setProperty('overflow-y', 'hidden', 'important');
                            parent.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
                            parent.style.setProperty('max-width', '100%', 'important');
                            parent.style.setProperty('touch-action', 'pan-x pan-y', 'important');
                            parent.style.setProperty('padding-bottom', '14px', 'important');

                            // Add subtle scroll indicator hint badge if not present
                            if (!parent.dataset.hintAdded) {
                                parent.dataset.hintAdded = 'true';
                                var card = parent.closest('.rounded-xl') || parent.parentElement;
                                if (card) {
                                    var existingHint = card.querySelector('.mobile-chart-hint');
                                    if (!existingHint) {
                                        var hint = document.createElement('div');
                                        hint.className = 'mobile-chart-hint';
                                        hint.innerHTML = '👉 Swipe horizontally to view all stages';
                                        hint.style.cssText = 'font-size: 11px; color: #2563eb; font-weight: 600; text-align: right; padding-right: 4px; margin-top: -4px; margin-bottom: 6px; letter-spacing: 0.01em;';
                                        parent.insertAdjacentElement('beforebegin', hint);
                                    }
                                }
                            }
                        }

                        // Calculate dynamic min-width based on tick/bar count (guarantee at least 42px per stage)
                        var tickCount = chart.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick').length || 20;
                        var targetWidth = Math.max(840, tickCount * 42) + 'px';
                        if (chart.style.minWidth !== targetWidth) {
                            chart.style.setProperty('min-width', targetWidth, 'important');
                            chart.style.setProperty('width', targetWidth, 'important');
                            chartNeedsResize = true;
                        }
                    });

                    if (chartNeedsResize) {
                        window.dispatchEvent(new Event('resize'));
                    }

                    // 8. Remove ERP Login / Dashboard button from landing page navbar in mobile app
                    var landingNavBtns = document.querySelectorAll('nav.absolute a');
                    landingNavBtns.forEach(function(btn) {
                        var txt = (btn.textContent || '').trim().toLowerCase();
                        var href = (btn.getAttribute('href') || '').toLowerCase();
                        if (txt === 'erp login' || txt === 'erp dashboard' || href.indexOf('login') !== -1 || href.indexOf('dashboard') !== -1) {
                            btn.style.setProperty('display', 'none', 'important');
                        }
                    });

                    // 9. Remove floating scroll-to-top arrow button from landing page in mobile app
                    var arrowIcons = document.querySelectorAll('button svg.lucide-arrow-up, button svg[class*="arrow-up"]');
                    arrowIcons.forEach(function(icon) {
                        var btn = icon.closest('button');
                        if (btn) {
                            var parentDiv = btn.parentElement;
                            if (parentDiv && parentDiv.classList.contains('fixed')) {
                                parentDiv.style.setProperty('display', 'none', 'important');
                            } else {
                                btn.style.setProperty('display', 'none', 'important');
                            }
                        }
                    });

                    // 10. Job Cards page mobile header cleanup: remove workflow badge, green live badge, and subtitle
                    var headings = document.querySelectorAll('h1');
                    headings.forEach(function(h1) {
                        if ((h1.textContent || '').indexOf('Job Cards') !== -1) {
                            var headerContainer = h1.parentElement;
                            if (headerContainer) {
                                var spans = headerContainer.querySelectorAll('span');
                                spans.forEach(function(s) {
                                    var sText = (s.textContent || '').trim().toUpperCase();
                                    if (sText.indexOf('STANDARD PRODUCTION WORKFLOW') !== -1 || sText === 'LIVE' || s.querySelector('.bg-emerald-500')) {
                                        s.style.setProperty('display', 'none', 'important');
                                    }
                                });
                            }
                            var infoCol = h1.closest('.min-w-0');
                            if (infoCol) {
                                var desc = infoCol.querySelector('p');
                                if (desc && (desc.textContent || '').indexOf('Track PCB Job Cards') !== -1) {
                                    desc.style.setProperty('display', 'none', 'important');
                                }
                            }
                        }
                    });

                    // 11. Proper arrangement for Job Cards quick action buttons on mobile
                    var actionRow = document.querySelector('div:has(> a[href*="/job-cards/launch"])') ||
                                    document.querySelector('div:has(> a[href*="/job-cards/movement"])');
                    if (actionRow && window.innerWidth <= 768) {
                        actionRow.style.setProperty('display', 'grid', 'important');
                        actionRow.style.setProperty('grid-template-columns', 'repeat(2, minmax(0, 1fr))', 'important');
                        actionRow.style.setProperty('gap', '8px', 'important');
                        actionRow.style.setProperty('width', '100%', 'important');
                        var btns = actionRow.children;
                        for (var bIdx = 0; bIdx < btns.length; bIdx++) {
                            btns[bIdx].style.setProperty('width', '100%', 'important');
                            btns[bIdx].style.setProperty('justify-content', 'center', 'important');
                        }
                        if (btns.length >= 5) {
                            btns[btns.length - 1].style.setProperty('grid-column', 'span 2 / span 2', 'important');
                        }
                    }

                    // 12. Section Switcher Tabs on mobile: side-by-side 2-col segmented control
                    var tabRow = document.querySelector('div:has(> button:has(svg.lucide-factory))');
                    if (tabRow && window.innerWidth <= 768) {
                        tabRow.style.setProperty('display', 'grid', 'important');
                        tabRow.style.setProperty('grid-template-columns', 'repeat(2, minmax(0, 1fr))', 'important');
                        tabRow.style.setProperty('gap', '6px', 'important');
                        tabRow.style.setProperty('width', '100%', 'important');
                        var tabs = tabRow.children;
                        for (var tIdx = 0; tIdx < tabs.length; tIdx++) {
                            tabs[tIdx].style.setProperty('width', '100%', 'important');
                            tabs[tIdx].style.setProperty('justify-content', 'center', 'important');
                            tabs[tIdx].style.setProperty('padding-left', '8px', 'important');
                            tabs[tIdx].style.setProperty('padding-right', '8px', 'important');
                        }
                    }

                    // 13. Proper 2x2 box arrangement for KPI metrics on mobile
                    var kpiContainer = document.querySelector('div:has(> div:has(> form input[placeholder*="Scan"]))');
                    if (kpiContainer && window.innerWidth <= 768) {
                        kpiContainer.style.setProperty('display', 'grid', 'important');
                        kpiContainer.style.setProperty('grid-template-columns', 'repeat(2, minmax(0, 1fr))', 'important');
                        kpiContainer.style.setProperty('gap', '10px', 'important');
                        kpiContainer.style.setProperty('width', '100%', 'important');

                        var kpiCards = kpiContainer.children;
                        if (kpiCards.length >= 5) {
                            kpiCards[0].style.setProperty('grid-column', 'span 2 / span 2', 'important');
                            for (var kIdx = 1; kIdx < kpiCards.length; kIdx++) {
                                var kCard = kpiCards[kIdx];
                                kCard.style.setProperty('display', 'flex', 'important');
                                kCard.style.setProperty('flex-direction', 'column', 'important');
                                kCard.style.setProperty('justify-content', 'space-between', 'important');
                                kCard.style.setProperty('padding', '12px', 'important');
                                kCard.style.setProperty('min-height', 'auto', 'important');
                                kCard.style.setProperty('gap', '6px', 'important');
                            }
                        }
                    }

                    // 14. Top 3 WIP Stages & Analytics widgets cleanup on mobile
                    var allH3s = document.querySelectorAll('h3');
                    allH3s.forEach(function(h3) {
                        var titleText = (h3.textContent || '').toUpperCase();
                        if (titleText.indexOf('TOP 3 WIP STAGES') !== -1 || titleText.indexOf('TOP 5 REJECTION') !== -1) {
                            var aCard = h3.closest('.rounded-xl') || h3.closest('.border');
                            if (aCard) {
                                aCard.style.setProperty('padding', '12px', 'important');
                                aCard.style.setProperty('border-radius', '16px', 'important');

                                var hRow = aCard.querySelector('.border-b');
                                if (hRow) {
                                    hRow.style.setProperty('padding-bottom', '8px', 'important');
                                    var sub = hRow.querySelector('p');
                                    if (sub) {
                                        sub.style.setProperty('display', 'none', 'important');
                                    }
                                    var bdg = hRow.querySelector('span:last-child');
                                    if (bdg) {
                                        bdg.style.setProperty('white-space', 'nowrap', 'important');
                                        bdg.style.setProperty('font-size', '11px', 'important');
                                        bdg.style.setProperty('padding', '2px 8px', 'important');
                                    }
                                }

                                var pBars = aCard.querySelectorAll('.bg-slate-800');
                                pBars.forEach(function(pb) {
                                    pb.style.setProperty('background', 'linear-gradient(90deg, #3b82f6, #1d4ed8)', 'important');
                                    pb.style.setProperty('border-radius', '9999px', 'important');
                                });
                            }
                        }
                    });
                }

                // Initial run
                applyOptimizations();
                
                // Periodic check to catch login transitions in SPAs
                if (!window.__mobileCheckInterval) {
                    window.__mobileCheckInterval = setInterval(applyOptimizations, 1000);
                }

                // MutationObserver for dynamic DOM changes
                if (!window.__mobileObserverAttached) {
                    window.__mobileObserverAttached = true;
                    var observer = new MutationObserver(applyOptimizations);
                    observer.observe(document.body, { childList: true, subtree: true });
                }
            })();
        """.trimIndent()

        webView.evaluateJavascript(jsScript, null)
    }

    private fun setupLaunchers() {
        permissionLauncher = registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { permissions ->
            val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
            openNativeFileChooser(cameraGranted)
        }

        fileChooserLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            if (result.resultCode == RESULT_OK) {
                var results: Array<Uri>? = null
                val data = result.data

                if (data == null || data.data == null) {
                    cameraImageUri?.let { uri ->
                        results = arrayOf(uri)
                    }
                } else {
                    data.dataString?.let { uriString ->
                        results = arrayOf(Uri.parse(Uri.parse(uriString).toString()))
                    }
                }
                fileUploadCallback?.onReceiveValue(results)
            } else {
                fileUploadCallback?.onReceiveValue(null)
            }
            fileUploadCallback = null
        }
    }

    private fun checkAndRequestPickerPermissions() {
        val requiredPermissions = mutableListOf<String>()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requiredPermissions.add(Manifest.permission.CAMERA)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) != PackageManager.PERMISSION_GRANTED) {
                requiredPermissions.add(Manifest.permission.READ_MEDIA_IMAGES)
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                requiredPermissions.add(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
        }

        if (requiredPermissions.isNotEmpty()) {
            permissionLauncher.launch(requiredPermissions.toTypedArray())
        } else {
            openNativeFileChooser(true)
        }
    }

    private fun openNativeFileChooser(allowCamera: Boolean) {
        val intentList = mutableListOf<Intent>()

        if (allowCamera) {
            val takePictureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
            if (takePictureIntent.resolveActivity(packageManager) != null) {
                var photoFile: File? = null
                try {
                    photoFile = createImageFile()
                } catch (ex: IOException) {
                    Toast.makeText(this, "Failed to create image file", Toast.LENGTH_SHORT).show()
                }

                if (photoFile != null) {
                    cameraImageUri = FileProvider.getUriForFile(
                        this,
                        "${packageName}.fileprovider",
                        photoFile
                    )
                    takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, cameraImageUri)
                    intentList.add(takePictureIntent)
                }
            }
        }

        val contentSelectionIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
        }

        val chooserIntent = Intent(Intent.ACTION_CHOOSER).apply {
            putExtra(Intent.EXTRA_INTENT, contentSelectionIntent)
            putExtra(Intent.EXTRA_TITLE, "Select File or Image")
            if (intentList.isNotEmpty()) {
                putExtra(Intent.EXTRA_INITIAL_INTENTS, intentList.toTypedArray())
            }
        }

        fileChooserLauncher.launch(chooserIntent)
    }

    @Throws(IOException::class)
    private fun createImageFile(): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val imageFileName = "JPEG_${timeStamp}_"
        val storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        return File.createTempFile(imageFileName, ".jpg", storageDir)
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val actNw = connectivityManager.getNetworkCapabilities(network) ?: return false
        return actNw.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                actNw.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                actNw.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
    }

    private fun showErrorLayout(show: Boolean) {
        if (show) {
            layoutError.visibility = View.VISIBLE
            webView.visibility = View.GONE
        } else {
            layoutError.visibility = View.GONE
            webView.visibility = View.VISIBLE
        }
    }
}
