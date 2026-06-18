import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const size = 1024;
const logoScale = 0.56;
const logoSize = Math.round(size * logoScale);
const input = path.join(root, 'assets/images/applogo.png');
const output = path.join(root, 'assets/images/app-icon.png');

const resized = await sharp(input)
  .resize(logoSize, logoSize, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  })
  .png()
  .toBuffer();

const pad = Math.floor((size - logoSize) / 2);

await sharp(resized)
  .extend({
    top: pad,
    bottom: size - logoSize - pad,
    left: pad,
    right: size - logoSize - pad,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  })
  .png()
  .toFile(output);

console.log(`Wrote ${output} (${size}x${size}, logo ~${logoScale * 100}% safe zone)`);
