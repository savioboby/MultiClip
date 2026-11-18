// MultiClip - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const masterToggle = document.getElementById('masterToggle');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusTitle = document.getElementById('statusTitle');
  const statusDesc = document.getElementById('statusDesc');
  const toggleCard = document.querySelector('.toggle-card');

  const delimiterButtons = document.querySelectorAll('.delimiter-btn');
  const queueCount = document.getElementById('queueCount');
  const queueChars = document.getElementById('queueChars');
  const copyAllBtn = document.getElementById('copyAllBtn');
  const copyAllBtnText = document.getElementById('copyAllBtnText');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const clipsContainer = document.getElementById('clipsContainer');

  const autoClearToggle = document.getElementById('autoClearToggle');
  const toastToggle = document.getElementById('toastToggle');

  let currentSettings = {
    enabled: true,
    delimiterMode: 'newline',
    autoClearOnPaste: false,
    showToast: true,
    clips: []
  };

  // Helper to format clips into combined text
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

  // Update System Clipboard with current combined string
  async function syncClipboardWithCurrentClips(clips, mode) {
    if (!clips || clips.length === 0) return;
    const combined = formatClips(clips, mode);
    try {
      await navigator.clipboard.writeText(combined);
    } catch (err) {
      console.warn('Could not sync clipboard from popup:', err);
    }
  }

  // Render the Master Toggle UI state
  function updateToggleUI(enabled) {
    masterToggle.checked = enabled;
    if (enabled) {
      statusIndicator.classList.add('active');
      toggleCard.classList.add('active');
      statusTitle.textContent = 'MultiClip Active';
      statusDesc.textContent = 'Accumulating text on Ctrl+C';
    } else {
      statusIndicator.classList.remove('active');
      toggleCard.classList.remove('active');
      statusTitle.textContent = 'MultiClip Paused';
      statusDesc.textContent = 'Normal single copy/paste active';
    }
  }

  // Render Delimiter Mode UI
  function updateDelimiterUI(mode) {
    delimiterButtons.forEach(btn => {
      if (btn.dataset.mode === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Render the Clips list
  function renderClips(clips) {
    const list = Array.isArray(clips) ? clips : [];
    const count = list.length;
    const combined = formatClips(list, currentSettings.delimiterMode);
    const totalChars = combined.length;

    queueCount.textContent = `${count} clip${count === 1 ? '' : 's'}`;
    queueChars.textContent = `${totalChars} char${totalChars === 1 ? '' : 's'}`;

    if (count === 0) {
      clipsContainer.innerHTML = `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm6 16H6V5h2v3h8V5h2v14z"/>
          </svg>
          <div class="empty-title">Queue is empty</div>
          <div class="empty-desc">Select text on any webpage and press Ctrl+C to accumulate multiple snippets across tabs.</div>
        </div>
      `;
      copyAllBtn.disabled = true;
      copyAllBtn.style.opacity = '0.5';
      clearAllBtn.disabled = true;
      clearAllBtn.style.opacity = '0.5';
      return;
    }

    copyAllBtn.disabled = false;
    copyAllBtn.style.opacity = '1';
    clearAllBtn.disabled = false;
    clearAllBtn.style.opacity = '1';

    clipsContainer.innerHTML = '';

    list.forEach((clip, index) => {
      const clipText = typeof clip === 'string' ? clip : (clip.text || '');
      const clipId = typeof clip === 'string' ? String(index) : (clip.id || String(index));

      const itemEl = document.createElement('div');
      itemEl.className = 'clip-item';
      itemEl.innerHTML = `
        <span class="clip-badge">#${index + 1}</span>
        <div class="clip-content" title="Click to expand/collapse">
          <div class="clip-text">${escapeHTML(clipText)}</div>
        </div>
        <div class="clip-item-actions">
          <button type="button" class="clip-action-icon-btn copy-single-btn" title="Copy this clip only" data-id="${clipId}">
            <svg viewBox="0 0 24 24">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          </button>
          <button type="button" class="clip-action-icon-btn delete-btn" title="Delete this clip" data-id="${clipId}">
            <svg viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        </div>
      `;

      // Expand / collapse on content click
      const contentEl = itemEl.querySelector('.clip-content');
      const textEl = itemEl.querySelector('.clip-text');
      contentEl.addEventListener('click', () => {
        textEl.classList.toggle('expanded');
      });

      // Copy single clip
      const singleCopyBtn = itemEl.querySelector('.copy-single-btn');
      singleCopyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(clipText);
        singleCopyBtn.style.color = '#10b981';
        setTimeout(() => {
          singleCopyBtn.style.color = '';
        }, 1200);
      });

      // Delete clip
      const deleteBtn = itemEl.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteClip(index);
      });

      clipsContainer.appendChild(itemEl);
    });
  }

  // Helper to escape HTML in previews
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Delete an individual clip
  function deleteClip(indexToDelete) {
    const updated = currentSettings.clips.filter((_, idx) => idx !== indexToDelete);
    currentSettings.clips = updated;
    chrome.storage.local.set({ clips: updated }, () => {
      syncClipboardWithCurrentClips(updated, currentSettings.delimiterMode);
      renderClips(updated);
    });
  }

  // Load state and populate UI
  function loadInitialState() {
    chrome.storage.local.get(null, (data) => {
      if (data) {
        currentSettings.enabled = data.enabled !== undefined ? data.enabled : true;
        currentSettings.delimiterMode = data.delimiterMode || 'newline';
        currentSettings.autoClearOnPaste = Boolean(data.autoClearOnPaste);
        currentSettings.showToast = data.showToast !== undefined ? data.showToast : true;
        currentSettings.clips = Array.isArray(data.clips) ? data.clips : [];
      }

      updateToggleUI(currentSettings.enabled);
      updateDelimiterUI(currentSettings.delimiterMode);
      autoClearToggle.checked = currentSettings.autoClearOnPaste;
      toastToggle.checked = currentSettings.showToast;
      renderClips(currentSettings.clips);
    });
  }

  // Event Listeners

  // 1. Master Toggle ON/OFF
  masterToggle.addEventListener('change', () => {
    const isEnabled = masterToggle.checked;
    currentSettings.enabled = isEnabled;
    chrome.storage.local.set({ enabled: isEnabled });
    updateToggleUI(isEnabled);
  });

  // 2. Delimiter Mode Selection
  delimiterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (!mode || mode === currentSettings.delimiterMode) return;
      currentSettings.delimiterMode = mode;
      chrome.storage.local.set({ delimiterMode: mode }, () => {
        updateDelimiterUI(mode);
        // Automatically sync clipboard with new delimiter format
        syncClipboardWithCurrentClips(currentSettings.clips, mode);
        renderClips(currentSettings.clips);
      });
    });
  });

  // 3. Copy All Combined
  copyAllBtn.addEventListener('click', async () => {
    const combined = formatClips(currentSettings.clips, currentSettings.delimiterMode);
    if (!combined) return;

    try {
      await navigator.clipboard.writeText(combined);
      copyAllBtn.classList.add('copied');
      copyAllBtnText.textContent = 'Copied!';
      setTimeout(() => {
        copyAllBtn.classList.remove('copied');
        copyAllBtnText.textContent = 'Copy All';
      }, 1500);
    } catch (err) {
      console.error('Failed to copy combined text:', err);
    }
  });

  // 4. Clear All Clips
  clearAllBtn.addEventListener('click', () => {
    currentSettings.clips = [];
    chrome.storage.local.set({ clips: [] }, () => {
      renderClips([]);
    });
  });

  // 5. Preferences: Auto-clear on paste
  autoClearToggle.addEventListener('change', () => {
    const val = autoClearToggle.checked;
    currentSettings.autoClearOnPaste = val;
    chrome.storage.local.set({ autoClearOnPaste: val });
  });

  // 6. Preferences: Show toast
  toastToggle.addEventListener('change', () => {
    const val = toastToggle.checked;
    currentSettings.showToast = val;
    chrome.storage.local.set({ showToast: val });
  });

  // 7. React in real time to background / other tab changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;

    if (changes.enabled !== undefined) {
      currentSettings.enabled = changes.enabled.newValue;
      updateToggleUI(currentSettings.enabled);
    }
    if (changes.delimiterMode !== undefined) {
      currentSettings.delimiterMode = changes.delimiterMode.newValue;
      updateDelimiterUI(currentSettings.delimiterMode);
    }
    if (changes.autoClearOnPaste !== undefined) {
      currentSettings.autoClearOnPaste = changes.autoClearOnPaste.newValue;
      autoClearToggle.checked = currentSettings.autoClearOnPaste;
    }
    if (changes.showToast !== undefined) {
      currentSettings.showToast = changes.showToast.newValue;
      toastToggle.checked = currentSettings.showToast;
    }
    if (changes.clips !== undefined) {
      currentSettings.clips = Array.isArray(changes.clips.newValue) ? changes.clips.newValue : [];
      renderClips(currentSettings.clips);
    }
  });

  // Initialize
  loadInitialState();
});
