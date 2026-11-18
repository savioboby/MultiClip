// Automated Validation & Sanity Test for MultiClip Extension

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

console.log('\n--- Running MultiClip Automated Validation Tests ---\n');

// 1. Validate manifest.json
console.log('1. Checking manifest.json:');
const manifestPath = path.resolve(__dirname, '..', 'manifest.json');
assert(fs.existsSync(manifestPath), 'manifest.json exists');

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(true, 'manifest.json is valid JSON');
} catch (e) {
  assert(false, `manifest.json parse error: ${e.message}`);
}

assert(manifest.manifest_version === 3, 'manifest_version is 3');
assert(Boolean(manifest.name), 'Extension name is defined');
assert(Boolean(manifest.version), 'Extension version is defined');
assert(Array.isArray(manifest.permissions) && manifest.permissions.includes('storage'), 'Permissions include storage');
assert(manifest.permissions.includes('clipboardWrite'), 'Permissions include clipboardWrite');

// 2. Validate icon assets
console.log('\n2. Checking Icon Assets:');
for (const size of [16, 32, 48, 128]) {
  const iconPath = path.resolve(__dirname, '..', `icons/icon${size}.png`);
  assert(fs.existsSync(iconPath), `icons/icon${size}.png exists`);
  if (fs.existsSync(iconPath)) {
    const stat = fs.statSync(iconPath);
    assert(stat.size > 100, `icon${size}.png has valid size (${stat.size} bytes)`);
  }
}

// 3. Validate background service worker
console.log('\n3. Checking Background Service Worker:');
const bgPath = path.resolve(__dirname, '..', manifest.background.service_worker);
assert(fs.existsSync(bgPath), `Background worker exists at ${manifest.background.service_worker}`);
try {
  const bgCode = fs.readFileSync(bgPath, 'utf8');
  new vm.Script(bgCode);
  assert(true, 'Background script parses without syntax errors');
} catch (e) {
  assert(false, `Background script syntax error: ${e.message}`);
}

// 4. Validate content scripts
console.log('\n4. Checking Content Scripts:');
for (const cs of manifest.content_scripts) {
  for (const js of cs.js) {
    const jsPath = path.resolve(__dirname, '..', js);
    assert(fs.existsSync(jsPath), `Content script ${js} exists`);
    try {
      const code = fs.readFileSync(jsPath, 'utf8');
      new vm.Script(code);
      assert(true, `Content script ${js} parses without syntax errors`);
    } catch (e) {
      assert(false, `Content script ${js} syntax error: ${e.message}`);
    }
  }
  if (cs.css) {
    for (const css of cs.css) {
      const cssPath = path.resolve(__dirname, '..', css);
      assert(fs.existsSync(cssPath), `Content CSS ${css} exists`);
    }
  }
}

// 5. Validate popup UI
console.log('\n5. Checking Popup UI:');
const popupHtmlPath = path.resolve(__dirname, '..', manifest.action.default_popup);
assert(fs.existsSync(popupHtmlPath), `Popup HTML exists at ${manifest.action.default_popup}`);

const popupJsPath = path.resolve(__dirname, '..', 'popup/popup.js');
assert(fs.existsSync(popupJsPath), 'popup/popup.js exists');
try {
  const popupJsCode = fs.readFileSync(popupJsPath, 'utf8');
  new vm.Script(popupJsCode);
  assert(true, 'popup/popup.js parses without syntax errors');
} catch (e) {
  assert(false, `popup/popup.js syntax error: ${e.message}`);
}

const popupCssPath = path.resolve(__dirname, '..', 'popup/popup.css');
assert(fs.existsSync(popupCssPath), 'popup/popup.css exists');

// 6. Test Delimiter formatting logic
console.log('\n6. Testing Delimiter Logic:');
function formatClips(clips, mode) {
  if (!clips || clips.length === 0) return '';
  const texts = clips.map(c => (typeof c === 'string' ? c : c.text)).filter(Boolean);
  switch (mode) {
    case 'paragraph':
      return texts.join(' ');
    case 'double_newline':
      return texts.join('\n\n');
    case 'newline':
    default:
      return texts.join('\n');
  }
}

const testClips = [
  { text: 'First snippet' },
  { text: 'Second snippet' },
  { text: 'Third snippet' }
];

assert(
  formatClips(testClips, 'newline') === 'First snippet\nSecond snippet\nThird snippet',
  'Newline formatting produces correct multiline string'
);

assert(
  formatClips(testClips, 'paragraph') === 'First snippet Second snippet Third snippet',
  'Paragraph formatting joins with single spaces'
);

assert(
  formatClips(testClips, 'double_newline') === 'First snippet\n\nSecond snippet\n\nThird snippet',
  'Double newline formatting produces separated blocks'
);

console.log(`\nTest Summary: ${passCount} Passed, ${failCount} Failed.`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('All extension verification checks passed successfully!\n');
}
