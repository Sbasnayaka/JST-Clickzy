// Run via: node setup.js
const fs = require('fs');
const https = require('https');
const path = require('path');

const libsDir = path.join(__dirname, 'extension', 'libs');
if (!fs.existsSync(libsDir)) fs.mkdirSync(libsDir, { recursive: true });

const files = [
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', dest: 'jspdf.umd.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', dest: 'pdf.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js', dest: 'pdf.worker.min.js' }
];

console.log("Downloading offline libraries for Manifest V3 compliance...");

files.forEach(file => {
  const destPath = path.join(libsDir, file.dest);
  const fileStream = fs.createWriteStream(destPath);
  https.get(file.url, response => {
    response.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`✅ Downloaded: ${file.dest}`);
    });
  }).on('error', err => {
    fs.unlink(destPath);
    console.error(`❌ Error downloading ${file.dest}:`, err.message);
  });
});