// import store from './store';
// const ipfs = require('ipfs');
// const node = ipfs();
//
// node.on('ready', () => {
//   //ready to use
// })

(global as any).browser = require('webextension-polyfill');

let curTabId;

(global as any).chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  curTabId = tabs[0].id;
});

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
    // alert('send popup-opened ' + curTabId + ' ' + JSON.stringify((global as any).chrome.tabs.sendMessage));
    (global as any).chrome.tabs.sendMessage(curTabId, { type: 'popup-opened' });
  }
  // if (request.type === 'get-ipfs') {
  //   sendResponse(lastAction);
  // }
});
