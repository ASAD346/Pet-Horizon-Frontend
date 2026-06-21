# Prints SHA-1/SHA-256 for the keystore that signs local Android release APKs.
$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Keystore = "$ProjectRoot\android\app\debug.keystore"
$JavaHome = if ($env:JAVA_HOME) { $env:JAVA_HOME } else { "E:\Android_Studio_Setup\Android_Studio_Install\jbr" }
$Keytool = "$JavaHome\bin\keytool.exe"

if (-not (Test-Path $Keystore)) {
  Write-Error "Keystore not found: $Keystore`nRun: npx expo prebuild --platform android"
}

Write-Host "Package name: com.anonymous.PetHorizon"
Write-Host "Keystore: $Keystore (used for local release APK builds)"
Write-Host ""

& $Keytool -list -v -keystore $Keystore -alias androiddebugkey -storepass android -keypass android |
  Select-String -Pattern "SHA1:|SHA256:"

Write-Host ""
Write-Host "Add the SHA-1 above in Firebase Console -> Project Settings -> Your Android app -> Add fingerprint."
