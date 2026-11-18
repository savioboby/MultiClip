// MultiClip - Background Service Worker (Manifest V3)

const DEFAULT_SETTINGS = {
  enabled: true,
  delimiterMode: 'newline', // 'newline' | 'paragraph' | 'double_newline'
  autoClearOnPaste: false,
  showToast: true,
  clips: []
};

// Format clips based on active delimiter mode
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

// Update the extension badge depending on state and clip count
function updateBadge(enabled, count) {
  if (!enabled) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#6B7280' }); // Slate Gray
    chrome.action.setTitle({ title: 'MultiClip is OFF (Click or press Alt+Shift+M to toggle)' });
  } else if (count > 0) {
    chrome.action.setBadgeText({ text: String(count) });
    chrome.action.setBadgeBackgroundColor({ color: '#2563EB' }); // Vibrant Blue
    chrome.action.setTitle({ title: `MultiClip: ${count} item${count === 1 ? '' : 's'} accumulated (Ctrl+V to paste)` });
  } else {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({ title: 'MultiClip is ON (Ready to accumulate copies)' });
  }
}

// Sync badge on initial startup / install
function syncBadgeFromStorage() {
  chrome.storage.local.get(['enabled', 'clips'], (data) => {
    const isEnabled = data.enabled !== undefined ? data.enabled : DEFAULT_SETTINGS.enabled;
    const clipsList = Array.isArray(data.clips) ? data.clips : [];
    updateBadge(isEnabled, clipsList.length);
  });
}

// Setup context menus
function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'multiclip_add_selection',
      title: 'Add to MultiClip',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'multiclip_copy_all',
      title: 'Copy all accumulated clips',
      contexts: ['all']
    });

    chrome.contextMenus.create({
      id: 'multiclip_clear',
      title: 'Clear MultiClip queue',
      contexts: ['all']
    });
  });
}

// Lifecycle events
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(null, (existing) => {
    const initial = { ...DEFAULT_SETTINGS, ...existing };
    chrome.storage.local.set(initial, () => {
      syncBadgeFromStorage();
      setupContextMenus();
    });
  });
});

chrome.runtime.onStartup.addListener(() => {
  syncBadgeFromStorage();
});

// React to storage changes across all tabs and popup
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  if (changes.enabled || changes.clips) {
    chrome.storage.local.get(['enabled', 'clips'], (data) => {
      const isEnabled = data.enabled !== undefined ? data.enabled : DEFAULT_SETTINGS.enabled;
      const count = Array.isArray(data.clips) ? data.clips.length : 0;
      updateBadge(isEnabled, count);
    });
  }
});

// Keyboard Commands handler
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-multiclip') {
    chrome.storage.local.get(['enabled'], (data) => {
      const current = data.enabled !== undefined ? data.enabled : DEFAULT_SETTINGS.enabled;
      const next = !current;
      chrome.storage.local.set({ enabled: next });
    });
  } else if (command === 'clear-clips') {
    chrome.storage.local.set({ clips: [] });
  }
});

// Context Menu handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'multiclip_add_selection' && info.selectionText) {
    chrome.storage.local.get(['clips', 'delimiterMode', 'enabled'], (data) => {
      if (data.enabled === false) return;
      const currentClips = Array.isArray(data.clips) ? data.clips : [];
      const newClip = {
        id: Date.now().toString(),
        text: info.selectionText.trim(),
        timestamp: Date.now(),
        sourceUrl: tab?.url || '',
        title: tab?.title || 'Web Selection'
      };
      const updatedClips = [...currentClips, newClip];
      chrome.storage.local.set({ clips: updatedClips });

      // Notify the active tab to write to clipboard & display toast
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'CLIP_ADDED_VIA_CONTEXT_MENU',
          clip: newClip,
          totalClips: updatedClips.length,
          combinedText: formatClips(updatedClips, data.delimiterMode || 'newline')
        }).catch(() => {
          // Ignore tabs where content script cannot be reached (e.g. chrome://)
        });
      }
    });
  } else if (info.menuItemId === 'multiclip_copy_all') {
    chrome.storage.local.get(['clips', 'delimiterMode'], (data) => {
      const clips = Array.isArray(data.clips) ? data.clips : [];
      const combined = formatClips(clips, data.delimiterMode || 'newline');
      if (tab?.id && combined) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'WRITE_TO_CLIPBOARD',
          text: combined,
          count: clips.length
        }).catch(() => {});
      }
    });
  } else if (info.menuItemId === 'multiclip_clear') {
    chrome.storage.local.set({ clips: [] });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'SHOW_TOAST',
        message: 'MultiClip queue cleared'
      }).catch(() => {});
    }
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'GET_FORMATTED_CLIPS') {
    chrome.storage.local.get(['clips', 'delimiterMode'], (data) => {
      const clips = Array.isArray(data.clips) ? data.clips : [];
      const mode = message.mode || data.delimiterMode || 'newline';
      sendResponse({ formatted: formatClips(clips, mode), count: clips.length });
    });
    return true; // Keep channel open for async response
  }
});
