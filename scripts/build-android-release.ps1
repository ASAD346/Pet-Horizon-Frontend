# Local release APK build — uses SDK at E:\Android_Studio_Setup
$ErrorActionPreference = "Stop"

$AndroidSdk = "E:\Android_Studio_Setup\Android_Sdk"
$JavaHome = "E:\Android_Studio_Setup\Android_Studio_Install\jbr"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ReleaseAbi = "arm64-v8a"

if (-not (Test-Path "$AndroidSdk\platform-tools\adb.exe")) {
  Write-Error "Android SDK not found at $AndroidSdk"
}

if (-not (Test-Path "$JavaHome\bin\java.exe")) {
  Write-Error "Java not found at $JavaHome"
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
Set-Location $ProjectRoot

$apk = "$ProjectRoot\android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apk) {
  Write-Host ""
  Write-Host "SUCCESS — APK ready:" -ForegroundColor Green
  Write-Host $apk
} else {
  Write-Error "Build finished but APK not found at $apk"
}
