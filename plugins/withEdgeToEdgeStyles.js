const { withAndroidStyles, AndroidConfig, createRunOncePlugin } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to remove deprecated status bar and navigation bar color items
 * from AppTheme in styles.xml for Android 15 edge-to-edge compliance.
 */
const withEdgeToEdgeStyles = (config) => {
  return withAndroidStyles(config, (config) => {
    config.modResults = AndroidConfig.Styles.removeStylesItem({
      xml: config.modResults,
      parent: { name: 'AppTheme' },
      name: 'android:statusBarColor',
    });
    config.modResults = AndroidConfig.Styles.removeStylesItem({
      xml: config.modResults,
      parent: { name: 'AppTheme' },
      name: 'android:navigationBarColor',
    });
    return config;
  });
};

module.exports = createRunOncePlugin(withEdgeToEdgeStyles, 'withEdgeToEdgeStyles', '1.0.0');
