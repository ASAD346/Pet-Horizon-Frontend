const { withAndroidManifest, createRunOncePlugin } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to remove screen orientation restrictions and ensure resizability
 * for large screen devices (Android 16+ compliance).
 *
 * 1. Ensures MainActivity does not restrict orientation (allowing tablets/foldables to rotate).
 * 2. Overrides GmsBarcodeScanningDelegateActivity to unspecified orientation with tools:replace,
 *    clearing Google Play Console's detected restrictions.
 * 3. Explicitly sets android:resizeableActivity="true" on application.
 */
const withLargeScreenOrientation = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;

    // Ensure tools namespace is declared
    if (!androidManifest.$['xmlns:tools']) {
      androidManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const application = androidManifest.application?.[0];
    if (application) {
      // Explicitly allow resizability for large screens and multi-window
      application.$['android:resizeableActivity'] = 'true';

      const activities = application.activity || [];

      // 1. Remove orientation lock from MainActivity
      const mainActivity = activities.find(
        (a) => a.$?.['android:name'] === '.MainActivity' || a.$?.['android:name'] === 'com.anonymous.PetHorizon.MainActivity'
      );
      if (mainActivity && mainActivity.$) {
        delete mainActivity.$['android:screenOrientation'];
      }

      // 2. Override GmsBarcodeScanningDelegateActivity
      const barcodeActivityName = 'com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity';
      let barcodeActivity = activities.find(
        (a) => a.$?.['android:name'] === barcodeActivityName
      );

      if (!barcodeActivity) {
        barcodeActivity = {
          $: {
            'android:name': barcodeActivityName,
            'android:screenOrientation': 'unspecified',
            'tools:replace': 'android:screenOrientation',
          },
        };
        activities.push(barcodeActivity);
      } else {
        barcodeActivity.$ = barcodeActivity.$ || {};
        barcodeActivity.$['android:screenOrientation'] = 'unspecified';
        const existingReplace = barcodeActivity.$['tools:replace'];
        if (existingReplace && !existingReplace.includes('android:screenOrientation')) {
          barcodeActivity.$['tools:replace'] = `${existingReplace},android:screenOrientation`;
        } else if (!existingReplace) {
          barcodeActivity.$['tools:replace'] = 'android:screenOrientation';
        }
      }

      application.activity = activities;
    }

    return config;
  });
};

module.exports = createRunOncePlugin(
  withLargeScreenOrientation,
  'withLargeScreenOrientation',
  '1.0.0'
);
