// scripts/sync-static.js - Synchronize static assets to public/ and dist/
import fs from 'fs';
import path from 'path';

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const dirsToSync = ['css', 'js', 'data', 'assets'];

dirsToSync.forEach(dir => {
  copyDirRecursive(`./${dir}`, `./public/${dir}`);
  if (fs.existsSync('./dist')) {
    copyDirRecursive(`./${dir}`, `./dist/${dir}`);
  }
});

console.log('Static assets synced to public/ and dist/');
