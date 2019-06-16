// import store from './store';
// const ipfs = require('ipfs');
// const node = ipfs();
//
// node.on('ready', () => {
//   //ready to use
// })
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('localhost', '5001', { protocol: 'http' });
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
  if (request.type === 'page-action') {
    setAction(request);
  }
  if (request.type === 'popup-get-action') {
    if (!sendResponse) {
      return;
    }
    sendResponse(lastAction);
    setAction(null);
    // alert('send popup-opened ' + curTabId + ' ' + JSON.stringify((global as any).chrome.tabs.sendMessage));
    (global as any).chrome.tabs.sendMessage(curTabId, { type: 'popup-opened' });
  }
  if (request.type === 'download-page') {
    // alert('download-page ' + JSON.stringify((global as any).singlefile.extension.core.bg.business));

    (global as any).chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      curTab = tabs[0];
      curTabId = curTab.id;
      (global as any).singlefile.extension.core.bg.business.saveTab(curTab);
    });
  }
  if (request.method && request.method.endsWith('.download')) {
    // console.log('my message.content', request.content);
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

    const content = Buffer.from(request.content, 'utf8');
    ipfs.add([{ content }]).then(async result => {
      await ipfs.pin.add(result[0].hash);
      setAction({ type: 'page-action', method: 'link', data: { contentHash: result[0].hash, keywords: null } });

      (global as any).chrome.runtime.sendMessage({
        type: 'loading-end',
      });

      (global as any).chrome.runtime.sendMessage(
        {
          type: 'page-action',
          method: 'link',
          data: {
            contentHash: result[0].hash,
            keywords: null,
          },
        },
        response => {
          setAction(null);
        }
      );
    });
  }
});
