import fs from 'fs';
import path from 'path';

const srcDir = path.resolve(process.cwd(), 'js');
const destDir = path.resolve(process.cwd(), 'public', 'js');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFiles() {
  ensureDir(destDir);

  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const src = path.join(srcDir, file);
    const dest = path.join(destDir, file);
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} -> ${path.relative(process.cwd(), dest)}`);
  }
}

try {
  copyFiles();
  console.log('Sync complete.');
} catch (err) {
  console.error('Sync failed:', err.message);
  process.exit(1);
}
