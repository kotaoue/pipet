(() => {
  'use strict';

  const LONG_PRESS_MS = 200;
  const KEYBOARD_CURSOR_CLASS = 'pipet-key-hold-active';

  let longPressTimer = null;
  let capturePos = null;
  let lastPointerPos = null;
  let activeTrigger = null;

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function rgbToHex(r, g, b) {
    return [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  async function copyToClipboard(text) {
    await navigator.clipboard.writeText(text);
  }

  function setKeyboardCursorActive(isActive) {
    document.documentElement.classList.toggle(KEYBOARD_CURSOR_CLASS, isActive);
  }

  function isEditableTarget(target) {
    if (!target) return false;

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return true;
    }

    return target.isContentEditable === true;
  }

  // ─── Color extraction ────────────────────────────────────────────────────────

  function extractColorAtPos(pos) {
    chrome.runtime.sendMessage({ type: 'capture' }, (response) => {
      if (!response || response.error || !response.dataUrl) {
        setKeyboardCursorActive(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // clientX/Y are CSS pixels; screenshots are in physical pixels.
        const dpr = window.devicePixelRatio || 1;
        const px = Math.min(Math.round(pos.x * dpr), img.width - 1);
        const py = Math.min(Math.round(pos.y * dpr), img.height - 1);
        const [r, g, b] = ctx.getImageData(px, py, 1, 1).data;

        const hex = rgbToHex(r, g, b);
        showAnimation(pos, hex);
        copyToClipboard(hex).finally(() => {
          setKeyboardCursorActive(false);
        });
      };
      img.onerror = () => {
        setKeyboardCursorActive(false);
      };
      img.src = response.dataUrl;
    });
  }

  // ─── Animation ───────────────────────────────────────────────────────────────

  function showAnimation(pos, hex) {
    const existing = document.getElementById('pipet-overlay');
    if (existing) existing.remove();

    const color = `#${hex}`;

    // Determine a contrasting text colour (black or white).
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    // Relative luminance (sRGB approximate)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const textColor = luminance > 128 ? '#222' : '#fff';

    const overlay = document.createElement('div');
    overlay.id = 'pipet-overlay';
    // Position the overlay centred on the cursor, offset upward.
    overlay.style.cssText = `left:${pos.x}px;top:${pos.y}px;`;

    overlay.innerHTML = `
      <div class="pipet-ripple" style="background:${color};"></div>
      <div class="pipet-popup">
        <div class="pipet-swatch" style="background:${color};">
          <svg class="pipet-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="${textColor}">
            <path d="M20.71 5.63l-2.34-2.34a1 1 0 0 0-1.41 0l-3.12 3.12-1.41-1.42-1.42 1.42
                     1.41 1.41-6.6 6.6A2 2 0 0 0 5 16v3h3a2 2 0 0 0 1.42-.59l6.6-6.6
                     1.41 1.42 1.42-1.42-1.42-1.41 3.12-3.12a1 1 0 0 0 0-1.65z"/>
          </svg>
        </div>
        <div class="pipet-label" style="background:${color};color:${textColor};">#${hex}</div>
        <div class="pipet-copied" style="background:${color};color:${textColor};">Copied!</div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Auto-remove after the popup fade-out animation completes.
    overlay.addEventListener('animationend', (e) => {
      if (e.animationName === 'pipet-popup-fade-out') overlay.remove();
    });
    // Safety fallback (popup animation ends at 0.4s delay + 1.6s = 2.0s).
    setTimeout(() => { if (overlay.isConnected) overlay.remove(); }, 2500);
  }

  // ─── Event listeners ─────────────────────────────────────────────────────────

  function startLongPress(pos, trigger) {
    cancelLongPress(trigger);

    capturePos = pos;
    activeTrigger = trigger;
    if (trigger === 'keyboard') {
      setKeyboardCursorActive(true);
    }
    longPressTimer = setTimeout(() => {
      const nextPos = capturePos;
      longPressTimer = null;
      capturePos = null;
      activeTrigger = null;

      if (nextPos) {
        extractColorAtPos(nextPos);
      }
    }, LONG_PRESS_MS);
  }

  function cancelLongPress(trigger = null) {
    if (trigger !== null && activeTrigger !== trigger) {
      return;
    }

    if (longPressTimer !== null) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    capturePos = null;
    if (activeTrigger === 'keyboard' || trigger === 'keyboard' || trigger === null) {
      setKeyboardCursorActive(false);
    }
    activeTrigger = null;
  }

  document.addEventListener('mousemove', (e) => {
    lastPointerPos = { x: e.clientX, y: e.clientY };
  }, true);

  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;

    const pos = { x: e.clientX, y: e.clientY };
    lastPointerPos = pos;
    startLongPress(pos, 'pointer');
  }, true);

  document.addEventListener('mouseup', () => cancelLongPress('pointer'), true);
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyC' || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (isEditableTarget(e.target)) return;
    if (!lastPointerPos) return;

    startLongPress(lastPointerPos, 'keyboard');
  }, true);
  document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyC') {
      cancelLongPress('keyboard');
    }
  }, true);
  // Cancel if the window loses focus (e.g. mouse released outside the viewport).
  window.addEventListener('blur', () => cancelLongPress());
  document.addEventListener('dragstart', () => cancelLongPress('pointer'), true);
  document.addEventListener('scroll', () => cancelLongPress('pointer'), true);
})();
