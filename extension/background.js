const DEFAULT_SITE = "http://localhost:3000";

// Build the "Download with VidsSave" right-click menu on install.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "vidssave-download",
    title: "Download with VidsSave",
    contexts: ["page", "link", "video", "image"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "vidssave-download") return;
  // Prefer a clicked link/media URL, fall back to the page URL.
  const target =
    info.linkUrl || info.srcUrl || info.pageUrl || (tab && tab.url) || "";
  if (!target) return;

  chrome.storage.sync.get({ siteUrl: DEFAULT_SITE }, ({ siteUrl }) => {
    const site = (siteUrl || DEFAULT_SITE).replace(/\/+$/, "");
    chrome.tabs.create({ url: `${site}/?url=${encodeURIComponent(target)}` });
  });
});
