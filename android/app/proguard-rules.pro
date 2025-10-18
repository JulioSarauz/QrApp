# ==========================
# Reglas ProGuard - Ionic / Capacitor + ML Kit + AdMob + ZXing
# ==========================

# Mantener las clases principales del framework Capacitor
-keep class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**

# Mantener los plugins de Capacitor (para evitar eliminación por reflexión)
-keep class com.capacitorjs.plugins.** { *; }
-dontwarn com.capacitorjs.plugins.**

# Mantener clases de ZXing (lector QR base)
-keep class com.google.zxing.** { *; }
-dontwarn com.google.zxing.**

# Mantener todas las clases del ML Kit (para evitar crash al abrir cámara)
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**

# Mantener clases necesarias para el escáner ML Kit Barcode
-keep class com.google.android.gms.internal.mlkit_vision_barcode.** { *; }
-dontwarn com.google.android.gms.internal.mlkit_vision_barcode.**

# Mantener las clases usadas por Google Mobile Ads (AdMob)
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**

# Evitar eliminación de código de WebView y JS interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Mantener nombres y tipos de recursos (útil para debug de errores)
-keepattributes SourceFile,LineNumberTable

# Opcional: mantener logs (para debug de producción)
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}
