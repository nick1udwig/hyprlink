// Hyprlink background script (service worker)
// Handles messages from content script and opens new tabs with transformed URLs

const api = typeof browser !== 'undefined' ? browser : chrome;

// Transform hw:// URL to node URL format
// hw://process:package:publisher.os/path → {nodeUrl}/#app-process:package:publisher.os/path
function transformHwUrl(hwUrl, nodeUrl) {
  const path = hwUrl.replace('hw://', '');
  // Ensure nodeUrl doesn't have trailing slash
  const baseUrl = nodeUrl.replace(/\/+$/, '');
  return `${baseUrl}/#app-${path}`;
}

// Listen for messages from content script
api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_HW_LINK') {
    const { hwUrl, nodeUrl } = message;
    const transformedUrl = transformHwUrl(hwUrl, nodeUrl);

    // Open new tab with transformed URL
    api.tabs.create({ url: transformedUrl });
  }
});
