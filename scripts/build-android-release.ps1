# Dynamic local release APK build
$ErrorActionPreference = "Continue"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ReleaseAbi = "arm64-v8a"

# Detect Android SDK
$AndroidSdk = $env:ANDROID_HOME
if (-not $AndroidSdk -or -not (Test-Path "$AndroidSdk\platform-tools\adb.exe")) {
  $AndroidSdk = "$env:USERPROFILE\AppData\Local\Android\Sdk"
}
if (-not (Test-Path "$AndroidSdk\platform-tools\adb.exe")) {
  $AndroidSdk = "E:\Android_Studio_Setup\Android_Sdk"
}

if (-not (Test-Path "$AndroidSdk\platform-tools\adb.exe")) {
  Write-Error "Android SDK not found at $AndroidSdk. Please set your ANDROID_HOME environment variable."
}

# Detect Java Home (JDK/JBR)
$JavaHome = $env:JAVA_HOME
if (-not $JavaHome -or -not (Test-Path "$JavaHome\bin\java.exe")) {
  $JavaHome = "C:\Program Files\Android\Android Studio\jbr"
}
if (-not (Test-Path "$JavaHome\bin\java.exe")) {
  $JavaHome = "E:\Android_Studio_Setup\Android_Studio_Install\jbr"
}

if (-not (Test-Path "$JavaHome\bin\java.exe")) {
  Write-Error "Java JDK/JBR not found at $JavaHome. Please set your JAVA_HOME environment variable."
}

$env:ANDROID_HOME = $AndroidSdk
$env:ANDROID_SDK_ROOT = $AndroidSdk
$env:JAVA_HOME = $JavaHome
$env:NODE_ENV = "production"
$env:Path = "$JavaHome\bin;$AndroidSdk\platform-tools;$AndroidSdk\cmdline-tools\latest\bin;$env:Path"

Set-Location $ProjectRoot

Write-Host "ANDROID_HOME=$env:ANDROID_HOME"
Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "Release ABI: $ReleaseAbi (physical Android phones only)"
& "$JavaHome\bin\java.exe" -version

Write-Host "Syncing android/ native config (Google Sign-In, google-services.json)..."
npx expo prebuild --platform android --no-install

function Set-GradleProperty {
  param(
    [string]$FilePath,
    [string]$Key,
    [string]$Value
  )

  $content = Get-Content -Path $FilePath -Raw
  $pattern = "(?m)^$([regex]::Escape($Key))=.*$"
  if ($content -match $pattern) {
    $content = [regex]::Replace($content, $pattern, "$Key=$Value")
  } else {
    $content = ($content.TrimEnd() + "`n$Key=$Value`n")
  }
  Set-Content -Path $FilePath -Value $content -Encoding ASCII
}

$gradleProps = "$ProjectRoot\android\gradle.properties"
Set-GradleProperty -FilePath $gradleProps -Key "reactNativeArchitectures" -Value $ReleaseAbi
Write-Host "Set reactNativeArchitectures=$ReleaseAbi in gradle.properties"

$localProps = "$ProjectRoot\android\local.properties"
$sdkDir = $AndroidSdk -replace '\\', '/'
Set-Content -Path $localProps -Value "sdk.dir=$sdkDir" -Encoding ASCII
Write-Host "Wrote $localProps"

Write-Host "Building release APK with Gradle (no phone/emulator needed)..."
Set-Location "$ProjectRoot\android"
& .\gradlew.bat assembleRelease `
  --no-daemon `
  --max-workers=2 `
  "-PreactNativeArchitectures=$ReleaseAbi"
$gradleExit = $LASTEXITCODE
Set-Location $ProjectRoot

if ($gradleExit -ne 0) {
  Write-Error "Gradle build failed with exit code $gradleExit"
  exit $gradleExit
}

$apk = "$ProjectRoot\android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apk) {
  Write-Host ""
  Write-Host "SUCCESS - APK ready:" -ForegroundColor Green
  Write-Host $apk
} else {
  Write-Error "Build finished but APK not found at $apk"
}

