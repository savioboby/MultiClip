// Script to package MultiClip into a clean Chrome Web Store compliant zip file
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const stageDir = path.join(distDir, 'stage');
const outZip = path.join(rootDir, 'multiclip-v1.0.0.zip');

// Clean previous outputs
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
if (fs.existsSync(outZip)) {
  fs.unlinkSync(outZip);
}

// Ensure staging structure
fs.mkdirSync(path.join(stageDir, 'background'), { recursive: true });
fs.mkdirSync(path.join(stageDir, 'content'), { recursive: true });
fs.mkdirSync(path.join(stageDir, 'popup'), { recursive: true });
fs.mkdirSync(path.join(stageDir, 'icons'), { recursive: true });

// Copy runtime files only
const filesToCopy = [
  ['manifest.json', 'manifest.json'],
  ['background/service-worker.js', 'background/service-worker.js'],
  ['content/content.js', 'content/content.js'],
  ['content/content.css', 'content/content.css'],
  ['popup/popup.html', 'popup/popup.html'],
  ['popup/popup.css', 'popup/popup.css'],
  ['popup/popup.js', 'popup/popup.js'],
  ['icons/icon16.png', 'icons/icon16.png'],
  ['icons/icon32.png', 'icons/icon32.png'],
  ['icons/icon48.png', 'icons/icon48.png'],
  ['icons/icon128.png', 'icons/icon128.png']
];

for (const [src, dest] of filesToCopy) {
  const srcPath = path.join(rootDir, src);
  const destPath = path.join(stageDir, dest);
  fs.copyFileSync(srcPath, destPath);
}

// Compress stage folder contents to multiclip-v1.0.0.zip
console.log('Compressing production extension bundle...');
const compressCmd = `powershell -Command "Compress-Archive -Path '${stageDir}\\*' -DestinationPath '${outZip}' -Force"`;
execSync(compressCmd, { stdio: 'inherit' });

// Clean staging directory
fs.rmSync(distDir, { recursive: true, force: true });

console.log(`Created Chrome Web Store package: ${outZip}`);
