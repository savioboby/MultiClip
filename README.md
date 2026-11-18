# MultiClip 📋✨

> **Cross-Tab Multi-Selection Copy & Clipboard Accumulator Chrome Extension (Manifest V3)**

MultiClip transforms how you collect and synthesize information across the web. Instead of constantly switching tabs to copy-paste one sentence or link at a time, MultiClip lets you select and copy multiple items across any number of open tabs. When you're ready, simply hit **Paste (`Ctrl+V`)** to paste everything together in one complete operation.

---

## 🚀 Key Features

- 📑 **Cross-Tab Multi-Copy Accumulation:**
  Select snippet #1 on Tab A and press `Ctrl+C`. Select snippet #2 on Tab B and press `Ctrl+C`. All snippets are immediately merged into your system clipboard and synced across every tab in real time.
- ⚡ **Seamless Universal Paste:**
  Works anywhere—in any browser tab, text editor, Word doc, Slack, Discord, or system application. Standard `Ctrl+V` pastes the full combined text immediately.
- 🎛️ **Master ON / OFF Toggle Switch:**
  Instantly pause MultiClip when you want standard single-copy behavior, and activate it whenever you're doing research or note-taking.
- 🔀 **Paste Delimiter Mode:**
  Choose how your accumulated clips are joined when pasted:
  - ↵ **New Line (`\n`):** Perfect for lists, bullet points, research notes, and code snippets.
  - ␣ **Paragraph (` `):** Joins snippets with spaces into a continuous paragraph.
  - ↵↵ **Double Line (`\n\n`):** Separates snippets with blank lines for markdown blocks.
- 🔔 **Isolated In-Page Visual HUD:**
  Displays a subtle, dark-mode pill notification in the bottom corner of your active page whenever a snippet is clipped, showing the current clip count and active format.
- 🗂️ **Live Popup Management:**
  - View individual clipped items with full text previews.
  - Delete individual clips or copy specific clips separately.
  - Live character and clip counter.
  - "Copy All" and "Clear All" quick-action buttons.
- ⚙️ **Configurable Preferences:**
  - **Auto-clear after paste:** Automatically resets the queue after you paste into a web document.
  - **Toggle HUD notifications:** Enable or disable the in-page toast popup.
- ⌨️ **Keyboard Shortcuts:**
  - `Alt + Shift + M`: Toggle MultiClip ON / OFF.
  - `Alt + Shift + C`: Clear all accumulated clips.
- 🖱️ **Context Menu Support:**
  Right-click any selected text to add it directly to MultiClip.

---

## 📦 How to Install in Google Chrome

1. Clone or download this repository to your computer:
   ```bash
   git clone <your-repo-url>
   # or extract the project folder to c:\Users\SAVIO\Desktop\MultiClip
   ```
2. Open Google Chrome and navigate to:
   ```text
   chrome://extensions/
   ```
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click the **Load unpacked** button in the top-left.
5. Select the `MultiClip` folder (`c:\Users\SAVIO\Desktop\MultiClip`).
6. 🎉 **MultiClip** is now installed and ready! Pin the extension to your Chrome toolbar for quick access.

---

## 🎯 How to Use

1. **Enable MultiClip:** Open the MultiClip popup from your toolbar and ensure the toggle is set to **Active**.
2. **Select Delimiter:** Pick **New Line** or **Paragraph** mode.
3. **Accumulate Copies:**
   - Go to any webpage, select some text, and press `Ctrl+C`. You will see a notification confirming the clip was added.
   - Switch to another tab or webpage, select more text, and press `Ctrl+C`.
4. **Paste Anywhere:**
   - Go to your destination document (Google Docs, Notion, Word, Notepad, or an email).
   - Press `Ctrl+V`. All accumulated selections will be pasted at once according to your chosen delimiter.
5. **Manage or Clear:**
   - Open the popup to view all clips, remove specific snippets, or clear the queue.

---

## 🛠️ Project Structure

```text
MultiClip/
├── manifest.json              # Chrome Extension Manifest V3 configuration
├── background/
│   └── service-worker.js      # Background service worker (badge, context menu, shortcuts)
├── content/
│   ├── content.js             # Content script (copy/paste interception, cross-tab sync, HUD)
│   └── content.css            # Isolated host styles
├── popup/
│   ├── popup.html             # Extension popup UI
│   ├── popup.css              # Modern responsive styling (dark/light mode support)
│   └── popup.js               # Popup logic & clip management
├── icons/
│   ├── icon16.png             # 16x16 icon
│   ├── icon32.png             # 32x32 icon
│   ├── icon48.png             # 48x48 icon
│   ├── icon128.png            # 128x128 icon
│   └── generate-icons.js      # Zero-dependency icon generator
├── test/
│   └── validate.js            # Automated test suite (Manifest, assets, JS syntax, delimiter logic)
├── scripts/
│   └── pack.js                # Extension packaging script
├── .gitignore                 # Git ignore rules
├── package.json               # Project metadata & npm scripts
└── README.md                  # Documentation
```

---

## 🧪 Development & Testing

Run the automated test suite:
```bash
npm test
```

Regenerate icons:
```bash
npm run build-icons
```

Package extension for distribution:
```bash
npm run pack
```

---

## 📤 Pushing to GitHub

To push this repository to your GitHub account:

1. Create a new repository on [GitHub](https://github.com/new) named `MultiClip` (leave "Initialize with README" unchecked).
2. Link your local repository and push:
   ```bash
   git remote add origin https://github.com/<your-username>/MultiClip.git
   git branch -M main
   git push -u origin main
   ```

---

## 📄 License

MIT License. Built for seamless cross-tab productivity.
