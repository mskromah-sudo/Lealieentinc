import https from 'https';
import fs from 'fs';
import path from 'path';

const url = 'https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80';
const outDir = path.resolve(process.cwd(), 'public', 'images');
const outPath = path.join(outDir, 'hero.jpg');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(outDir);

console.log('Downloading hero image...');
https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error('Failed to download image, status:', res.statusCode);
    process.exit(1);
  }

  const file = fs.createWriteStream(outPath);
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Downloaded hero image to', outPath);
  });
}).on('error', (err) => {
  console.error('Error downloading image:', err.message);
  process.exit(1);
});
