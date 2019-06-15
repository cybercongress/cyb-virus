// import store from './store';

(global as any).browser = require('webextension-polyfill');

let lastAction;
(global as any).browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'page-action') {
    lastAction = request;
    (global as any).chrome.browserAction.setBadgeText({ text: '!' });
  }
  if (request.type === 'popup-get-action') {
    sendResponse(lastAction);
    lastAction = null;
    (global as any).chrome.browserAction.setBadgeText({ text: '' });
  }
});
