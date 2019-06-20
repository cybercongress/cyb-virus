(global as any).browser = require('webextension-polyfill');

const chrome = (global as any).chrome;
const browser = (global as any).browser;

module.exports = {
  setBadgeText: data => chrome.browserAction.setBadgeText(data),
  onMessage: (request, sender, sendResponse) => browser.runtime.onMessage.addListener(request, sender, sendResponse),
  sendTabMessage: (tabId, data) => chrome.tabs.sendMessage(tabId, data),
  sendPopupMessage: data => chrome.runtime.sendMessage(data),
  getCurrentTab: () => new Promise((resolve, reject) => chrome.tabs.query({ active: true, currentWindow: true }, tabs => resolve(tabs[0]))),
};
