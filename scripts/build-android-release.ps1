# Local release APK build — uses SDK at E:\Android_Studio_Setup
$ErrorActionPreference = "Stop"

$AndroidSdk = "E:\Android_Studio_Setup\Android_Sdk"
$JavaHome = "E:\Android_Studio_Setup\Android_Studio_Install\jbr"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path "$AndroidSdk\platform-tools\adb.exe")) {
  Write-Error "Android SDK not found at $AndroidSdk"
}

if (-not (Test-Path "$JavaHome\bin\java.exe")) {
  Write-Error "Java not found at $JavaHome"
}

$env:ANDROID_HOME = $AndroidSdk
$env:ANDROID_SDK_ROOT = $AndroidSdk
$env:JAVA_HOME = $JavaHome
$env:Path = "$JavaHome\bin;$AndroidSdk\platform-tools;$AndroidSdk\cmdline-tools\latest\bin;$env:Path"

Set-Location $ProjectRoot

Write-Host "ANDROID_HOME=$env:ANDROID_HOME"
Write-Host "JAVA_HOME=$env:JAVA_HOME"
& "$JavaHome\bin\java.exe" -version

if (-not (Test-Path "$ProjectRoot\android")) {
  Write-Host "Generating android/ folder (expo prebuild)..."
  npx expo prebuild --platform android --no-install
}

$localProps = "$ProjectRoot\android\local.properties"
$sdkDir = $AndroidSdk -replace '\\', '/'
Set-Content -Path $localProps -Value "sdk.dir=$sdkDir" -Encoding ASCII
Write-Host "Wrote $localProps"

Write-Host "Building release APK with Gradle (no phone/emulator needed)..."
Set-Location "$ProjectRoot\android"
& .\gradlew.bat assembleRelease --no-daemon
Set-Location $ProjectRoot

$apk = "$ProjectRoot\android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apk) {
  Write-Host ""
  Write-Host "SUCCESS — APK ready:" -ForegroundColor Green
  Write-Host $apk
} else {
  Write-Error "Build finished but APK not found at $apk"
}
