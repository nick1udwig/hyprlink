// Use browser API for Firefox compatibility, fall back to chrome
const api = typeof browser !== 'undefined' ? browser : chrome;

document.addEventListener('DOMContentLoaded', () => {
  const nodeUrlInput = document.getElementById('nodeUrl');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');
  const currentUrlDiv = document.getElementById('currentUrl');

  // Load saved URL on popup open
  api.storage.sync.get(['nodeUrl'], (result) => {
    if (result.nodeUrl) {
      nodeUrlInput.value = result.nodeUrl;
      currentUrlDiv.innerHTML = `<strong>Current:</strong> ${result.nodeUrl}`;
    } else {
      currentUrlDiv.innerHTML = '<strong>Not configured</strong>';
    }
  });

  // Save URL when button clicked
  saveBtn.addEventListener('click', () => {
    const url = nodeUrlInput.value.trim();

    if (!url) {
      status.textContent = 'Please enter a URL';
      status.className = 'status error';
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (e) {
      status.textContent = 'Invalid URL format';
      status.className = 'status error';
      return;
    }

    // Remove trailing slash for consistency
    const normalizedUrl = url.replace(/\/+$/, '');

    api.storage.sync.set({ nodeUrl: normalizedUrl }, () => {
      status.textContent = 'Saved!';
      status.className = 'status success';
      currentUrlDiv.innerHTML = `<strong>Current:</strong> ${normalizedUrl}`;

      // Clear success message after 2 seconds
      setTimeout(() => {
        status.textContent = '';
        status.className = 'status';
      }, 2000);
    });
  });

  // Allow saving with Enter key
  nodeUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveBtn.click();
    }
  });
});
