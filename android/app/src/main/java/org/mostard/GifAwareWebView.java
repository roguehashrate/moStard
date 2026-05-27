package org.mostard;

import android.content.ClipData;
import android.content.ContentResolver;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.AttributeSet;
import android.util.Base64;
import android.util.Log;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputConnection;
import android.view.inputmethod.InputConnectionWrapper;
import android.view.inputmethod.InputContentInfo;
import android.webkit.WebView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.core.view.ContentInfoCompat;
import androidx.core.view.ViewCompat;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

public class GifAwareWebView extends WebView {

    private static final String TAG = "GifAwareWebView";

    public GifAwareWebView(Context context) {
        super(context);
        init();
    }

    public GifAwareWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public GifAwareWebView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        ViewCompat.setOnReceiveContentListener(this, new String[]{
            "image/*", "image/gif", "image/png", "image/jpeg", "image/webp"
        }, (view, payload) -> {
            if (payload != null && payload.getClip() != null) {
                handleClipData(payload.getClip());
                return null;
            }
            return payload;
        });
    }

    @Override
    public InputConnection onCreateInputConnection(EditorInfo outAttrs) {
        InputConnection ic = super.onCreateInputConnection(outAttrs);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            outAttrs.contentMimeTypes = new String[]{
                "image/gif", "image/png", "image/jpeg", "image/webp"
            };
        }
        if (ic != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1) {
            ic = new GifInputConnection(ic, true);
        }
        return ic;
    }

    private void handleClipData(ClipData clip) {
        for (int i = 0; i < clip.getItemCount(); i++) {
            ClipData.Item item = clip.getItemAt(i);
            Uri uri = item.getUri();
            if (uri != null) {
                injectContentUri(uri);
                return;
            }
        }
    }

    void injectContentUri(Uri uri) {
        try {
            ContentResolver resolver = getContext().getContentResolver();
            String mimeType = resolver.getType(uri);
            if (mimeType == null) mimeType = "image/gif";

            InputStream is = resolver.openInputStream(uri);
            if (is == null) {
                Log.w(TAG, "Failed to open input stream for " + uri);
                return;
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }
            is.close();

            byte[] data = baos.toByteArray();
            String base64 = Base64.encodeToString(data, Base64.NO_WRAP);

            String js = "(function() { var h = window.__mostardPasteImage; if (h) h(\"" +
                mimeType.replace("\"", "\\\"") + "\",\"" + base64 + "\"); })();";

            post(() -> evaluateJavascript(js, null));
        } catch (Exception e) {
            Log.e(TAG, "Failed to inject content URI", e);
        }
    }

    @RequiresApi(Build.VERSION_CODES.N_MR1)
    private class GifInputConnection extends InputConnectionWrapper {
        GifInputConnection(InputConnection target, boolean mutable) {
            super(target, mutable);
        }

        @Override
        public boolean commitContent(@NonNull InputContentInfo inputContentInfo, int flags, Bundle opts) {
            Uri uri = inputContentInfo.getContentUri();
            if (uri != null) {
                try {
                    inputContentInfo.requestPermission();
                } catch (Exception e) {
                    Log.w(TAG, "requestPermission failed", e);
                }
                injectContentUri(uri);
                return true;
            }
            return super.commitContent(inputContentInfo, flags, opts);
        }
    }
}
