// Background service worker
// Handles screenshot capture requests from the content script.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'capture') {
    chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ dataUrl });
      }
    });
    // Return true to indicate we will send a response asynchronously.
    return true;
  }
});
