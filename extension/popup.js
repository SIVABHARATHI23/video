// Defensive popup script: always renders, and shows a clear message if anything
// (tab access, restricted page, storage) goes wrong instead of failing silently.
const DEFAULT_SITE = "http://localhost:3000";

const urlEl = document.getElementById("current-url");
const siteEl = document.getElementById("site");
const btn = document.getElementById("download");
const msgEl = document.getElementById("message");

let currentUrl = "";

function showMessage(text, kind) {
  msgEl.textContent = text;
  msgEl.className = "msg " + (kind || "error");
}

function isRestricted(u) {
  return (
    !u ||
    u.startsWith("chrome://") ||
    u.startsWith("edge://") ||
    u.startsWith("about:") ||
    u.startsWith("chrome-extension://") ||
    u.startsWith("https://chrome.google.com/webstore") ||
    u === "about:blank"
  );
}

// 1) Load the saved site URL (or default).
try {
  chrome.storage.sync.get({ siteUrl: DEFAULT_SITE }, (res) => {
    siteEl.value = (res && res.siteUrl) || DEFAULT_SITE;
  });
} catch (e) {
  siteEl.value = DEFAULT_SITE;
}

// Persist the site URL whenever it changes.
siteEl.addEventListener("change", () => {
  const value = siteEl.value.trim() || DEFAULT_SITE;
  try {
    chrome.storage.sync.set({ siteUrl: value });
  } catch (e) {
    /* ignore */
  }
});

// 2) Read the active tab's URL.
try {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      urlEl.textContent = "Could not read the current tab.";
      showMessage("Permission error: " + chrome.runtime.lastError.message, "error");
      return;
    }
    const tab = tabs && tabs[0];
    currentUrl = (tab && tab.url) || "";

    if (isRestricted(currentUrl)) {
      urlEl.textContent = currentUrl || "No URL";
      showMessage(
        "Open a normal video page (YouTube, TikTok, Instagram…) first — this kind of page can't be downloaded.",
        "warn",
      );
      return;
    }

    urlEl.textContent = currentUrl;
    btn.disabled = false;
  });
} catch (e) {
  urlEl.textContent = "Could not read the current tab.";
  showMessage("Error: " + (e && e.message ? e.message : e), "error");
}

// 3) Open the site with the link prefilled.
btn.addEventListener("click", () => {
  if (!currentUrl) return;
  const site = (siteEl.value.trim() || DEFAULT_SITE).replace(/\/+$/, "");
  const target = `${site}/?url=${encodeURIComponent(currentUrl)}`;
  try {
    chrome.tabs.create({ url: target });
    window.close();
  } catch (e) {
    showMessage("Could not open a new tab: " + (e && e.message ? e.message : e), "error");
  }
});
