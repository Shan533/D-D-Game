const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ensure the favicon directory exists
const faviconDir = path.resolve(__dirname, '../public/favicon');
if (!fs.existsSync(faviconDir)) {
  fs.mkdirSync(faviconDir, { recursive: true });
}

// Path to the SVG favicon
const svgPath = path.resolve(faviconDir, 'favicon.svg');

// Generate different sizes
const sizes = {
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'favicon-64x64.png': 64,
  'apple-touch-icon.png': 180,
  'android-chrome-192x192.png': 192,
  'android-chrome-512x512.png': 512,
};

// Convert SVG to PNG at different sizes
Object.entries(sizes).forEach(([filename, size]) => {
  const outputPath = path.resolve(faviconDir, filename);
  
  sharp(svgPath)
    .resize(size, size)
    .png()
    .toFile(outputPath)
    .then(() => {
      console.log(`Generated ${filename}`);
    })
    .catch(err => {
      console.error(`Error generating ${filename}:`, err);
    });
});

// Generate favicon.ico (multi-size ICO file)
// For this we'll use the 16x16 and 32x32 PNGs once they're generated
setTimeout(() => {
  const favicon16Path = path.resolve(faviconDir, 'favicon-16x16.png');
  const favicon32Path = path.resolve(faviconDir, 'favicon-32x32.png');
  
  // We'll just copy the 32x32 PNG to ICO for simplicity
  // In a production environment, you might want to use a proper ICO generator
  fs.copyFileSync(favicon32Path, path.resolve(faviconDir, 'favicon.ico'));
  console.log('Generated favicon.ico');
}, 1000); // Wait 1 second to ensure PNGs are generated first 