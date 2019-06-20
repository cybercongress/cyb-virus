// import store from './store';
// const ipfs = require('ipfs');
// const node = ipfs();
//
// node.on('ready', () => {
//   //ready to use
// })
const ipfsService = require('./services/ipfs');
const databaseService = require('./services/database');
databaseService.init();
const _ = require('lodash');
// const geesome = require('./services/geesome');

(global as any).browser = require('webextension-polyfill');

let curTabId;
let curTab;

(global as any).chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  curTab = tabs[0];
  if (!curTab) {
    return;
  }
  curTabId = curTab.id;
});

function setAction(action) {
  lastAction = action;
  if (lastAction) {
    (global as any).chrome.browserAction.setBadgeText({ text: '!' });
  } else {
    (global as any).chrome.browserAction.setBadgeText({ text: '' });
  }
}

let lastAction;
(global as any).browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('request', request);
  if (request.type === 'page-action') {
    setAction(request);
    return;
  }
  if (request.type === 'popup-get-action') {
    (global as any).chrome.runtime.sendMessage(lastAction);
    setAction(null);
    // alert('send popup-opened ' + curTabId + ' ' + JSON.stringify((global as any).chrome.tabs.sendMessage));
    (global as any).chrome.tabs.sendMessage(curTabId, { type: 'popup-opened' });
    return;
  }
  if (request.type === 'download-page') {
    (global as any).chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      curTab = tabs[0];
      curTabId = curTab.id;
      (global as any).singlefile.extension.core.bg.business.saveTab(curTab);
    });
    return;
  }
  if (request.type === 'get-content-list') {
    console.log('onMessage', 'get-content-list');
    databaseService.getContent().then(contentList => {
      console.log('getContent', contentList);
      (global as any).chrome.runtime.sendMessage({
        type: 'show-content-list',
        data: contentList,
      });
    });
    return;
  }
  if (request.method && _.endsWith(request.method, '.download')) {
    (global as any).chrome.runtime.sendMessage({
      type: 'loading',
    });

    // geesome.saveData(request.content, request.filename).then(ipfsHash => {
    //   setAction({ type: 'page-action', method: 'link', data: { contentHash: ipfsHash, keywords: null } });
    //
    // (global as any).chrome.runtime.sendMessage({
    //   type: 'loading-end',
    // });
    //   (global as any).chrome.runtime.sendMessage(
    //     {
    //       type: 'page-action',
    //       method: 'link',
    //       data: {
    //         contentHash: ipfsHash,
    //         keywords: null,
    //       },
    //     },
    //     response => {
    //       setAction(null);
    //     }
    //   );
    // });

    ipfsService.saveContent(request.content).then(result => {
      databaseService.addContent({
        contentHash: result.hash,
        size: result.size,
      });

      setAction({ type: 'page-action', method: 'link', data: { contentHash: result.hash, keywords: null } });

      (global as any).chrome.runtime.sendMessage({
        type: 'loading-end',
      });

      (global as any).chrome.runtime.sendMessage(
        {
          type: 'page-action',
          method: 'link',
          data: { contentHash: result.hash, keywords: null },
        },
        response => {
          setAction(null);
        }
      );
    });
  }
});
