# Local release AAB build for Google Play Store
$ErrorActionPreference = "Continue"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
# Play Store requires multi-architecture bundle for wide device compatibility
$ReleaseAbi = "armeabi-v7a,arm64-v8a,x86,x86_64"

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
  exit 1
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
  exit 1
}

$env:ANDROID_HOME = $AndroidSdk
$env:ANDROID_SDK_ROOT = $AndroidSdk
$env:JAVA_HOME = $JavaHome
$env:NODE_ENV = "production"
$env:Path = "$JavaHome\bin;$AndroidSdk\platform-tools;$AndroidSdk\cmdline-tools\latest\bin;$env:Path"

Set-Location $ProjectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Building Google Play App Bundle (.aab) " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ANDROID_HOME=$env:ANDROID_HOME"
Write-Host "JAVA_HOME=$env:JAVA_HOME"
Write-Host "Target Architectures: $ReleaseAbi"
& "$JavaHome\bin\java.exe" -version

Write-Host "`nSyncing android/ native config..." -ForegroundColor Yellow
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

Write-Host "`nBuilding release AAB bundle with Gradle..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\android"
& .\gradlew.bat bundleRelease `
  --no-daemon `
  --max-workers=2 `
  "-PreactNativeArchitectures=$ReleaseAbi"

$gradleExit = $LASTEXITCODE
Set-Location $ProjectRoot

if ($gradleExit -ne 0) {
  Write-Error "Gradle AAB build failed with exit code $gradleExit"
  exit $gradleExit
}

$aab = "$ProjectRoot\android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aab) {
  $fileInfo = Get-Item $aab
  $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
  Write-Host ""
  Write-Host "============================================================" -ForegroundColor Green
  Write-Host " SUCCESS - Google Play AAB Bundle Ready!" -ForegroundColor Green
  Write-Host " File: $aab" -ForegroundColor Green
  Write-Host " Size: $fileSizeMB MB" -ForegroundColor Green
  Write-Host "============================================================" -ForegroundColor Green
} else {
  Write-Error "Build finished but AAB not found at $aab"
  exit 1
}
