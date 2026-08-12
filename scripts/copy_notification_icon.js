const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../assets/images/android-icon-monochrome.png');
const dests = [
  '../android/app/src/main/res/drawable/notification_icon.png',
  '../android/app/src/main/res/drawable-hdpi/notification_icon.png',
  '../android/app/src/main/res/drawable-mdpi/notification_icon.png',
  '../android/app/src/main/res/drawable-xhdpi/notification_icon.png',
  '../android/app/src/main/res/drawable-xxhdpi/notification_icon.png',
  '../android/app/src/main/res/drawable-xxxhdpi/notification_icon.png',
];

dests.forEach((dest) => {
  const destPath = path.join(__dirname, dest);
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, destPath);
  console.log(`Copied notification icon to ${dest}`);
});
