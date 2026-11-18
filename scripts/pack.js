// Helper script to package MultiClip into a clean zip distribution
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const outZip = path.join(rootDir, 'multiclip-v1.0.0.zip');

if (fs.existsSync(outZip)) {
  fs.unlinkSync(outZip);
}

try {
  // Use PowerShell Compress-Archive on Windows
  console.log('Packaging extension files into multiclip-v1.0.0.zip...');
  const filesToInclude = 'manifest.json, background, content, popup, icons, README.md';
  const command = `powershell -Command "Compress-Archive -Path ${filesToInclude} -DestinationPath multiclip-v1.0.0.zip -Force"`;
  execSync(command, { cwd: rootDir, stdio: 'inherit' });
  console.log('Successfully created multiclip-v1.0.0.zip!');
} catch (err) {
  console.error('Packaging failed:', err.message);
}
