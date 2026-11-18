// MultiClip - Content Script
// Manages selection capture, clipboard aggregation, and in-page HUD notification

(function () {
  // Prevent duplicate injection in the same frame
  if (window.__multiclip_injected) return;
  window.__multiclip_injected = true;

  let state = {
    enabled: true,
    delimiterMode: 'newline',
    autoClearOnPaste: false,
    showToast: true,
    clips: []
  };

  // Helper: Format clips according to delimiter mode
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

  // Load initial settings and clips from storage
  chrome.storage.local.get(null, (data) => {
    if (data) {
      state.enabled = data.enabled !== undefined ? data.enabled : true;
      state.delimiterMode = data.delimiterMode || 'newline';
      state.autoClearOnPaste = Boolean(data.autoClearOnPaste);
      state.showToast = data.showToast !== undefined ? data.showToast : true;
      state.clips = Array.isArray(data.clips) ? data.clips : [];
    }
  });

  // Listen for storage changes across all tabs and popup
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;

    if (changes.enabled !== undefined) {
      state.enabled = changes.enabled.newValue;
    }
    if (changes.delimiterMode !== undefined) {
      state.delimiterMode = changes.delimiterMode.newValue;
    }
    if (changes.autoClearOnPaste !== undefined) {
      state.autoClearOnPaste = Boolean(changes.autoClearOnPaste.newValue);
    }
    if (changes.showToast !== undefined) {
      state.showToast = Boolean(changes.showToast.newValue);
    }
    if (changes.clips !== undefined) {
      state.clips = Array.isArray(changes.clips.newValue) ? changes.clips.newValue : [];
    }
  });

  // Intercept standard Copy event
  document.addEventListener('copy', (e) => {
    if (!state.enabled) return;

    // Ignore if copying from sensitive password input
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.type === 'password' || activeEl.getAttribute('type') === 'password')) {
      return;
    }

    // Determine selected text
    let selectedText = '';
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      const start = activeEl.selectionStart;
      const end = activeEl.selectionEnd;
      if (typeof start === 'number' && typeof end === 'number' && start !== end) {
        selectedText = activeEl.value.substring(start, end);
      }
    }

    if (!selectedText) {
      const selection = window.getSelection();
      selectedText = selection ? selection.toString() : '';
    }

    selectedText = selectedText.trim();
    if (!selectedText) return;

    // Create new clip object
    const newClip = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
      text: selectedText,
      timestamp: Date.now(),
      sourceUrl: window.location.href,
      title: document.title || 'Web Selection'
    };

    const updatedClips = [...state.clips, newClip];
    const combinedText = formatClips(updatedClips, state.delimiterMode);

    // Synchronously write accumulated text to system clipboard
    if (e.clipboardData) {
      e.clipboardData.setData('text/plain', combinedText);
      e.preventDefault();
    }

    // Persist to storage (triggers sync across tabs & updates badge)
    state.clips = updatedClips;
    chrome.storage.local.set({ clips: updatedClips });

    // Show visual feedback toast
    if (state.showToast) {
      const count = updatedClips.length;
      const snippet = selectedText.length > 35 ? selectedText.substring(0, 32) + '...' : selectedText;
      const modeLabel = state.delimiterMode === 'paragraph' ? 'Paragraph' : (state.delimiterMode === 'double_newline' ? 'Double Line' : 'New Line');
      showMultiClipToast({
        title: `Added clip #${count}`,
        subtitle: `"${snippet}"`,
        badge: `${count} total`,
        footer: `Format: ${modeLabel} - Ready to paste (Ctrl+V)`
      });
    }
  });

  // Intercept Paste event (for auto-clear feature)
  document.addEventListener('paste', () => {
    if (!state.enabled || !state.autoClearOnPaste) return;

    if (state.clips && state.clips.length > 0) {
      setTimeout(() => {
        chrome.storage.local.set({ clips: [] });
        if (state.showToast) {
          showMultiClipToast({
            title: 'MultiClip Cleared',
            subtitle: 'Queue reset after paste',
            badge: '0 items',
            footer: 'Auto-clear on paste is enabled'
          });
        }
      }, 80);
    }
  });

  // Listen for messages from background script (Context menu actions, etc.)
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'CLIP_ADDED_VIA_CONTEXT_MENU') {
      if (message.combinedText && navigator.clipboard) {
        navigator.clipboard.writeText(message.combinedText).catch(() => {});
      }
      if (state.showToast) {
        showMultiClipToast({
          title: `Added clip #${message.totalClips}`,
          subtitle: `Added via context menu`,
          badge: `${message.totalClips} total`,
          footer: 'Ready to paste (Ctrl+V)'
        });
      }
    } else if (message.action === 'WRITE_TO_CLIPBOARD') {
      if (message.text && navigator.clipboard) {
        navigator.clipboard.writeText(message.text).catch(() => {});
      }
      if (state.showToast) {
        showMultiClipToast({
          title: `MultiClip Copied`,
          subtitle: `${message.count} clips merged to clipboard`,
          badge: 'Copied',
          footer: 'Ready to paste (Ctrl+V)'
        });
      }
    } else if (message.action === 'SHOW_TOAST') {
      if (state.showToast) {
        showMultiClipToast({
          title: 'MultiClip',
          subtitle: message.message || '',
          badge: 'Info',
          footer: ''
        });
      }
    }
  });

  // Floating Toast HUD using isolated Shadow DOM to avoid host CSS contamination
  let hostEl = null;
  let shadowRoot = null;
  let toastTimer = null;

  function ensureToastContainer() {
    if (hostEl && hostEl.isConnected) return;

    hostEl = document.createElement('div');
    hostEl.id = 'multiclip-toast-host';
    hostEl.style.cssText = 'all: initial !important; position: fixed !important; z-index: 2147483647 !important; bottom: 20px !important; right: 20px !important; pointer-events: none !important;';
    
    shadowRoot = hostEl.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .mc-toast {
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 260px;
        max-width: 340px;
        background: #0f172a;
        color: #f8fafc;
        padding: 12px 14px;
        border-radius: 12px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
        transform: translateY(20px) scale(0.96);
        opacity: 0;
        transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease;
      }
      .mc-toast.show {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      .mc-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .mc-title-box {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .mc-icon {
        width: 18px;
        height: 18px;
        fill: #38bdf8;
        flex-shrink: 0;
      }
      .mc-title {
        font-size: 13px;
        font-weight: 600;
        color: #f1f5f9;
      }
      .mc-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 9999px;
        background: #2563eb;
        color: #ffffff;
      }
      .mc-subtitle {
        font-size: 12px;
        color: #94a3b8;
        line-height: 1.4;
        word-break: break-word;
        font-style: italic;
      }
      .mc-footer {
        font-size: 11px;
        color: #64748b;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 6px;
        margin-top: 2px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .mc-clear-btn {
        background: none;
        border: none;
        color: #f87171;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        padding: 2px 4px;
        border-radius: 4px;
      }
      .mc-clear-btn:hover {
        background: rgba(248, 113, 113, 0.15);
      }
    `;

    shadowRoot.appendChild(style);
    document.documentElement.appendChild(hostEl);
  }

  function showMultiClipToast({ title, subtitle, badge, footer }) {
    ensureToastContainer();
    if (!shadowRoot) return;

    // Remove existing toast if any
    const existing = shadowRoot.querySelector('.mc-toast');
    if (existing) {
      existing.remove();
    }
    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    const toast = document.createElement('div');
    toast.className = 'mc-toast';
    toast.innerHTML = `
      <div class="mc-header">
        <div class="mc-title-box">
          <svg class="mc-icon" viewBox="0 0 24 24">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
          </svg>
          <span class="mc-title">${title}</span>
        </div>
        ${badge ? `<span class="mc-badge">${badge}</span>` : ''}
      </div>
      ${subtitle ? `<div class="mc-subtitle">${subtitle}</div>` : ''}
      <div class="mc-footer">
        <span>${footer || 'Ready to paste'}</span>
        <button class="mc-clear-btn" id="mc-btn-clear">Clear</button>
      </div>
    `;

    shadowRoot.appendChild(toast);

    // Hook clear button
    const clearBtn = toast.querySelector('#mc-btn-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        chrome.storage.local.set({ clips: [] });
        toast.remove();
      });
    }

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 250);
    }, 2800);
  }
})();
