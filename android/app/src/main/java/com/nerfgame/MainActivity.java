package com.nerfgame;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends Activity {

    private static final String TAG = "DartStrike";
    private static final String APP_ASSET_HOST = "appassets.androidplatform.net";
    private static final String APP_ASSET_URL =
        "https://appassets.androidplatform.net/assets/index.html";

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView.setWebContentsDebuggingEnabled(
            (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);

        // Immersive fullscreen.
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN);

        // Dark root layout prevents a white flash before WebView paints.
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        root.addView(webView);
        setContentView(root);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        // Block raw file:// access. AssetLoader provides a secure
        // https://appassets.androidplatform.net origin instead.
        webSettings.setAllowFileAccess(false);
        webSettings.setAllowContentAccess(false);
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Serves files from android_asset/ under a pseudo-https origin so the
        // bundled JS/CSS/images resolve correctly with standard fetch / import
        // semantics (no CORS issues, no file:// quirks).
        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(
                    WebView view, WebResourceRequest request) {
                Uri requestUri = request.getUrl();
                WebResourceResponse response =
                    assetLoader.shouldInterceptRequest(requestUri);
                if (response == null && APP_ASSET_HOST.equals(requestUri.getHost())) {
                    Log.w(TAG, "Asset loader miss: " + requestUri);
                }
                return response;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.i(TAG, "Page loaded: " + url);
            }

            @Override
            public void onReceivedError(WebView view,
                    WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                Log.e(TAG, "Resource error  url=" + request.getUrl()
                    + "  code=" + error.getErrorCode()
                    + "  desc=" + error.getDescription()
                    + "  mainFrame=" + request.isForMainFrame());
            }

            @Override
            public void onReceivedHttpError(WebView view,
                    WebResourceRequest request,
                    WebResourceResponse errorResponse) {
                super.onReceivedHttpError(view, request, errorResponse);
                Log.e(TAG, "HTTP error  url=" + request.getUrl()
                    + "  status=" + errorResponse.getStatusCode()
                    + "  reason=" + errorResponse.getReasonPhrase());
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(@NonNull ConsoleMessage cm) {
                String msg = "JS [" + cm.messageLevel() + "] "
                    + cm.sourceId() + ":" + cm.lineNumber()
                    + " - " + cm.message();
                switch (cm.messageLevel()) {
                    case ERROR:
                        Log.e(TAG, msg);
                        break;
                    case WARNING:
                        Log.w(TAG, msg);
                        break;
                    case DEBUG:
                    case TIP:
                    case LOG:
                    default:
                        Log.i(TAG, msg);
                        break;
                }
                return true;
            }
        });

        Log.i(TAG, "Loading: " + APP_ASSET_URL);
        webView.loadUrl(APP_ASSET_URL);
        webView.requestFocus();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.loadUrl("about:blank");
            webView.destroy();
        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
