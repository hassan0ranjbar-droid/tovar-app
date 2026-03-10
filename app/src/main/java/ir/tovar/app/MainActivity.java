package ir.tovar.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends Activity {

    private static final String SERVER = "http://185.208.79.216:8080";
    private static final int REQ_PERMS = 100;
    private static final int REQ_FILE = 101;

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private View splashView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // status bar سبز توار
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window w = getWindow();
            w.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            w.setStatusBarColor(Color.parseColor("#0D7065"));
        }

        // ─── Layout: splash + webview روی هم
        FrameLayout root = new FrameLayout(this);

        // WebView
        webView = new WebView(this);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT));
        root.addView(webView);

        // Splash (پس‌زمینه سبز تا اپ لود بشه)
        splashView = new View(this);
        splashView.setBackgroundColor(Color.parseColor("#128C7E"));
        splashView.setLayoutParams(new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT));
        root.addView(splashView);

        setContentView(root);

        setupWebView();
        requestPermissions();
        webView.loadUrl(SERVER);

        // splash رو بعد از ۲.۵ ثانیه پنهان کن
        new Handler(Looper.getMainLooper()).postDelayed(() ->
            splashView.animate().alpha(0).setDuration(400)
                .withEndAction(() -> splashView.setVisibility(View.GONE)), 2500);
    }

    private void setupWebView() {
        WebSettings s = webView.getSettings();

        // JavaScript و storage
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);

        // فایل و media
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        s.setMediaPlaybackRequiresUserGesture(false);

        // viewport
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);

        // cache
        s.setCacheMode(WebSettings.LOAD_DEFAULT);

        // User-Agent (توار شناسه داشته باشه)
        s.setUserAgentString(s.getUserAgentString() + " TovarApp/1.0 Android");

        webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        // اتصال Java → JS برای نوتیفیکیشن native
        webView.addJavascriptInterface(new TovarBridge(), "TovarNative");

        // ─── WebViewClient
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                String url = req.getUrl().toString();
                if (url.startsWith("http://185.208.79.216") ||
                    url.startsWith("http://localhost") ||
                    url.startsWith("https://185.208.79.216")) {
                    return false;
                }
                // لینک خارجی → مرورگر
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (Exception ignored) {}
                return true;
            }

            @Override
            public void onReceivedError(WebView view, int code, String desc, String url) {
                showOfflinePage();
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                // inject: به JS بگو native app هست
                view.evaluateJavascript("window.isNativeApp=true;", null);
            }
        });

        // ─── WebChromeClient (دوربین، فایل، مجوزها)
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                // تمام مجوزهای WebRTC/media رو قبول کن
                request.grant(request.getResources());
            }

            @Override
            public boolean onShowFileChooser(WebView wv, ValueCallback<Uri[]> cb,
                                             FileChooserParams params) {
                fileCallback = cb;
                Intent intent = params.createIntent();
                try {
                    startActivityForResult(intent, REQ_FILE);
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin,
                                                           GeolocationPermissions.Callback cb) {
                cb.invoke(origin, true, false);
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage msg) {
                return true; // suppress logs in release
            }
        });
    }

    // ─── صفحه آفلاین
    private void showOfflinePage() {
        String html = "<!DOCTYPE html><html dir='rtl'><head>" +
            "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
            "<style>*{margin:0;padding:0;box-sizing:border-box}" +
            "body{display:flex;flex-direction:column;align-items:center;justify-content:center;" +
            "min-height:100vh;background:#f5f5f5;font-family:sans-serif;padding:24px;text-align:center}" +
            ".ico{font-size:72px;margin-bottom:20px}" +
            "h2{color:#128C7E;font-size:20px;margin-bottom:10px}" +
            "p{color:#666;font-size:14px;line-height:1.6;margin-bottom:28px}" +
            "button{background:#25D366;color:#fff;border:none;padding:14px 36px;" +
            "border-radius:28px;font-size:16px;cursor:pointer;box-shadow:0 4px 12px rgba(37,211,102,.4)}" +
            "</style></head><body>" +
            "<div class='ico'>📡</div>" +
            "<h2>اتصال برقرار نشد</h2>" +
            "<p>سرور در دسترس نیست یا اینترنت قطع است.<br>لطفاً چند لحظه صبر کنید.</p>" +
            "<button onclick='location.reload()'>🔄 تلاش مجدد</button>" +
            "</body></html>";
        webView.loadData(html, "text/html; charset=utf-8", "UTF-8");
    }

    // ─── Bridge: JS → Java
    class TovarBridge {
        @JavascriptInterface
        public void vibrate(int ms) {
            android.os.Vibrator v = (android.os.Vibrator) getSystemService(VIBRATOR_SERVICE);
            if (v != null) v.vibrate(ms > 0 ? ms : 50);
        }

        @JavascriptInterface
        public String getDeviceInfo() {
            return Build.MANUFACTURER + " " + Build.MODEL + " / Android " + Build.VERSION.RELEASE;
        }
    }

    // ─── درخواست مجوزها
    private void requestPermissions() {
        String[] perms;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            perms = new String[]{
                Manifest.permission.CAMERA,
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.READ_MEDIA_IMAGES,
                Manifest.permission.READ_MEDIA_VIDEO,
                Manifest.permission.POST_NOTIFICATIONS
            };
        } else {
            perms = new String[]{
                Manifest.permission.CAMERA,
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            };
        }
        boolean need = false;
        for (String p : perms) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                need = true; break;
            }
        }
        if (need) ActivityCompat.requestPermissions(this, perms, REQ_PERMS);
    }

    // ─── نتیجه انتخاب فایل
    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_FILE) {
            Uri[] uris = null;
            if (res == Activity.RESULT_OK && data != null) {
                String d = data.getDataString();
                if (d != null) uris = new Uri[]{Uri.parse(d)};
                else if (data.getClipData() != null) {
                    int n = data.getClipData().getItemCount();
                    uris = new Uri[n];
                    for (int i = 0; i < n; i++)
                        uris[i] = data.getClipData().getItemAt(i).getUri();
                }
            }
            if (fileCallback != null) { fileCallback.onReceiveValue(uris); fileCallback = null; }
        }
    }

    // ─── دکمه برگشت
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            new AlertDialog.Builder(this)
                .setTitle("خروج از توار")
                .setMessage("آیا می‌خواهید از برنامه خارج شوید؟")
                .setPositiveButton("بله", (d, w) -> finishAndRemoveTask())
                .setNegativeButton("خیر", null)
                .show();
        }
    }

    @Override protected void onResume()  { super.onResume();  webView.onResume();  }
    @Override protected void onPause()   { super.onPause();   webView.onPause();   }
    @Override protected void onDestroy() { if (webView != null) webView.destroy(); super.onDestroy(); }
}
