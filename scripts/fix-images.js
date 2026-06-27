/**
 * Re-encodes problematic PNG assets that fail AAPT2 compilation.
 * Strips ICC profiles and metadata that Android's resource compiler rejects.
 */
const sharp = require('sharp');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets', 'images');

const problemFiles = [
  'dog_qr_icon.png',
  'onboarding_health.png',
  'onboarding_family.png',
  'onboarding_tracking.png',
];

async function fixImages() {
  for (const file of problemFiles) {
    const filePath = path.join(assetsDir, file);
    const tmpPath = filePath + '.tmp.png';
    try {
      await sharp(filePath)
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(tmpPath);

      const fs = require('fs');
      fs.renameSync(tmpPath, filePath);
      console.log(`✅ Fixed: ${file}`);
    } catch (err) {
      console.error(`❌ Failed to fix ${file}:`, err.message);
    }
  }
  console.log('\nDone. Now re-run: npm run build:release:local');
}

fixImages();
