# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# Keep essential React Native bridge and layout components
-keep class com.facebook.react.** { *; }
-keep class com.facebook.systrace.** { *; }
-keep class com.facebook.yoga.** { *; }
-keep class com.facebook.proguard.annotations.** { *; }

# Keep native methods and classes used by JNI
-keepclasseswithmembers class * {
    native <methods>;
}

# Keep JS/Hermes internal bridge classes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Optimization & Obfuscation Tweaks
-repackageclasses ''
-allowaccessmodification

