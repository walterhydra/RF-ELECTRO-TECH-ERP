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
        const val ERP_TARGET_URL = "https://rf-electrotech.vercel.app/"
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
        swipeRefreshLayout.setOnRefreshListener {
            if (isNetworkAvailable()) {
                showErrorLayout(false)
                webView.clearCache(true)
                webView.reload()
            } else {
                swipeRefreshLayout.isRefreshing = false
                showErrorLayout(true)
            }
        }

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

                if (url.contains("rf-electrotech.vercel.app") || url.contains("vercel.app")) {
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
                    if (!existingStyle) {
                        var style = document.createElement('style');
                        style.id = styleId;
                        style.innerHTML = `
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

                                /* Mobile View: Exclusively display Job Cards & Split section in navigation */
                                aside nav a:not([href*="job-cards"]),
                                [class*="w-64"] nav a:not([href*="job-cards"]) {
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

                                /* Main Content Area adjustments */
                                main, .flex-1, div.flex-1 {
                                    width: 100% !important;
                                    max-width: 100vw !important;
                                    margin-left: 0 !important;
                                }
                            }
                        `;
                        document.head.appendChild(style);
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

                    // 7. Auto-navigate to /job-cards if user is on dashboard in mobile view
                    var isAuth = localStorage.getItem('isAuthenticated') === 'true' || Boolean(localStorage.getItem('token'));
                    if (isAuth && (window.location.pathname === '/dashboard' || window.location.pathname === '/' || window.location.pathname === '')) {
                        window.location.replace('/job-cards');
                    }
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
