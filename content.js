// Hyprlink content script
// Intercepts hw:// links on external sites and redirects to user's Hyperware node

(function() {
  'use strict';

  const api = typeof browser !== 'undefined' ? browser : chrome;
  let nodeUrl = null;
  let isNodeSite = false;

  // Initialize: fetch node URL and check if we're on the node site
  function init() {
    api.storage.sync.get(['nodeUrl'], (result) => {
      if (result.nodeUrl) {
        nodeUrl = result.nodeUrl;
        // Check if current site is the node
        try {
          const nodeHost = new URL(nodeUrl).host;
          const currentHost = window.location.host;
          isNodeSite = nodeHost === currentHost;
        } catch (e) {
          isNodeSite = false;
        }

        if (!isNodeSite) {
          setupInterceptors();
        }
      }
    });
  }

  // Set up all interceptors for hw:// links
  function setupInterceptors() {
    interceptLinkClicks();
    interceptWindowOpen();
  }

  // Intercept clicks on <a href="hw://..."> links
  function interceptLinkClicks() {
    document.addEventListener('click', (e) => {
      // Find the closest anchor tag (handles clicks on child elements)
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (href && href.startsWith('hw://')) {
        e.preventDefault();
        e.stopPropagation();
        handleHwLink(href);
      }
    }, true); // Use capture phase to intercept before other handlers
  }

  // Intercept window.open() calls with hw:// URLs
  function interceptWindowOpen() {
    const originalOpen = window.open;

    window.open = function(url, ...args) {
      if (url && typeof url === 'string' && url.startsWith('hw://')) {
        handleHwLink(url);
        return null;
      }
      return originalOpen.call(window, url, ...args);
    };
  }

  // Handle an intercepted hw:// link
  function handleHwLink(hwUrl) {
    if (!nodeUrl) {
      console.warn('[Hyprlink] No node URL configured. Please set it in the extension popup.');
      return;
    }

    // Send message to background script to open the transformed URL
    api.runtime.sendMessage({
      type: 'OPEN_HW_LINK',
      hwUrl: hwUrl,
      nodeUrl: nodeUrl
    });
  }

  // Listen for storage changes (in case user updates node URL while page is open)
  api.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.nodeUrl) {
      nodeUrl = changes.nodeUrl.newValue;
      // Re-check if we're on the node site
      if (nodeUrl) {
        try {
          const nodeHost = new URL(nodeUrl).host;
          const currentHost = window.location.host;
          isNodeSite = nodeHost === currentHost;
        } catch (e) {
          isNodeSite = false;
        }
      }
    }
  });

  // Start
  init();
})();
