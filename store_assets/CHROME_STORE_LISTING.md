# Chrome Web Store Publishing Guide & Listing Details

This document contains everything needed to publish MultiClip to the Chrome Web Store in just a few minutes.

---

## 1. Extension Package File (Ready to Upload)

The exact package file ready for upload is located at:
`C:\Users\SAVIO\Desktop\MultiClip\multiclip-v1.0.0.zip`

---

## 2. Developer Dashboard Access

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Sign in with your Google account.
3. If this is your first time publishing, complete the one-time developer registration ($5 USD fee charged by Google).
4. Click **New Item** (top right) and upload `multiclip-v1.0.0.zip`.

---

## 3. Store Listing Form Details (Copy-Paste Ready)

### Item Name
```text
MultiClip - Cross-Tab Multi-Copy & Accumulator
```

### Summary Description (126 / 132 characters)
```text
Select and copy multiple text snippets across tabs, accumulating them to paste all at once with custom formatting.
```

### Detailed Description
```text
MultiClip transforms how you collect and synthesize information across the web. Instead of constantly switching tabs to copy-paste one snippet at a time, MultiClip lets you select and copy multiple items across any number of open tabs. When you are ready, simply press Paste (Ctrl+V) to paste everything together in one complete operation.

KEY FEATURES:
- Cross-Tab Accumulation: Copy multiple selections across different tabs without losing previous clips.
- Universal Paste: Standard Ctrl+V in any application or web page pastes all accumulated text at once.
- Paste Delimiters: Choose between New Line (\n), Paragraph (space), or Double Line (\n\n).
- Master ON / OFF Toggle: Easily pause MultiClip when you want standard single-copy behavior.
- Clean In-Page Feedback: Non-intrusive floating notification confirms each copied snippet.
- Live Clip Manager: Open the popup to view, delete, or individually copy collected clips.
- Privacy-Focused: 100% local. No data ever leaves your computer.

KEYBOARD SHORTCUTS:
- Alt + Shift + M: Toggle MultiClip ON / OFF
- Alt + Shift + C: Clear accumulated queue
```

### Category
```text
Productivity
```

---

## 4. Visual Store Assets

Upload the pre-generated images located in the `store_assets/` folder:

- **Store Screenshot (1280x800):**
  `C:\Users\SAVIO\Desktop\MultiClip\store_assets\screenshot_1280x800.png`
- **Small Promo Tile (440x280):**
  `C:\Users\SAVIO\Desktop\MultiClip\store_assets\promo_tile_440x280.png`
- **Icon (128x128):**
  `C:\Users\SAVIO\Desktop\MultiClip\icons\icon128.png`

---

## 5. Privacy Practices Tab Declarations (Crucial for Approval)

When filling out the **Privacy practices** tab in the developer console, use these answers to ensure fast review approval:

### Single Purpose Declaration:
```text
MultiClip has the single purpose of accumulating multiple text selections across browser tabs into a single combined clipboard entry.
```

### Permission Justifications:
- **storage:**
  `Used to locally store user preferences (toggle state, delimiter mode) and accumulated text clips across tabs.`
- **clipboardWrite:**
  `Required to write the aggregated text clips into the system clipboard so the user can paste them all at once.`
- **clipboardRead:**
  `Used to read the current clip buffer when user manages or merges text.`
- **contextMenus:**
  `Provides convenient right-click options for users to add selections or clear the queue.`
- **activeTab:**
  `Allows the extension to display visual toast feedback when a snippet is clipped.`
- **Host Permissions (<all_urls>):**
  `MultiClip operates across any webpage where the user chooses to select and copy text to accumulate across tabs.`

### Data Usage:
- Does your extension collect personal data? **No**
- Does your extension sell user data? **No**
- Does your extension use or transfer data for purposes unrelated to the single purpose? **No**
- Does your extension use or transfer data to determine creditworthiness or for lending purposes? **No**
