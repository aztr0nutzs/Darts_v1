package com.nerfgame;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
<<<<<<< ours
import android.os.Bundle;
import android.util.Log;
import android.view.View;
=======
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
>>>>>>> theirs
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
<<<<<<< ours

=======
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
>>>>>>> theirs
import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends Activity {

<<<<<<< ours
    private static final String TAG = "MainActivity";
    private static final String APP_HOST = "https://appassets.androidplatform.net";
=======
    private static final String TAG = "NerfWebView";
    private static final String APP_ASSET_URL = "https://appassets.androidplatform.net/assets/index.html";
>>>>>>> theirs

    private WebView webView;
    private WebViewAssetLoader assetLoader;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

<<<<<<< ours
        WebView.setWebContentsDebuggingEnabled(true);
        assetLoader = new WebViewAssetLoader.Builder()
            .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

=======
>>>>>>> theirs
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN);

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
<<<<<<< ours
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);

        webView.setBackgroundColor(Color.WHITE);
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                Log.d(TAG, "Page finished loading: " + url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                Log.e(TAG, "WebView error: " + error);
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.d(TAG, consoleMessage.message() + " @ " + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber());
                return true;
            }
        });

        webView.loadUrl(APP_HOST + "/index.html");
        webView.requestFocus();
=======
        webSettings.setAllowFileAccess(false);
        webSettings.setAllowContentAccess(false);

        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri requestUri = request.getUrl();
                WebResourceResponse response = assetLoader.shouldInterceptRequest(requestUri);
                if (response == null) {
                    Log.w(TAG, "No local asset mapping for request: " + requestUri);
                }
                return response;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.i(TAG, "Page finished: " + url);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                Log.e(TAG, "Web resource error. url=" + request.getUrl()
                    + " code=" + error.getErrorCode()
                    + " desc=" + error.getDescription()
                    + " mainFrame=" + request.isForMainFrame());
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                super.onReceivedHttpError(view, request, errorResponse);
                Log.e(TAG, "HTTP error. url=" + request.getUrl()
                    + " status=" + errorResponse.getStatusCode()
                    + " reason=" + errorResponse.getReasonPhrase());
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(@NonNull ConsoleMessage consoleMessage) {
                String msg = "JS " + consoleMessage.messageLevel()
                    + " " + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber()
                    + " - " + consoleMessage.message();
                switch (consoleMessage.messageLevel()) {
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

        Log.i(TAG, "Loading app URL: " + APP_ASSET_URL);
        webView.loadUrl(APP_ASSET_URL);
>>>>>>> theirs
    }
}
