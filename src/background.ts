const ipfsService = require('./services/ipfs');
const databaseService = require('./backgroundServices/database');
databaseService.init();
const _ = require('lodash');
// const geesome = require('./services/geesome');

(global as any).browser = require('webextension-polyfill');

const { setBadgeText, onMessage, sendTabMessage, sendPopupMessage, getCurrentTab } = require('./backgroundServices/actions');

let curTabId;
let curTab;
function fetchCurrentTab() {
  return getCurrentTab().then(tab => {
    curTab = tab;
    if (!curTab) {
      return;
    }
    curTabId = curTab.id;
  });
}

function setAction(action) {
  lastAction = action;
  if (lastAction) {
    setBadgeText({ text: '!' });
  } else {
    setBadgeText({ text: '' });
  }
}

fetchCurrentTab();

let lastAction;
onMessage((request, sender, sendResponse) => {
  console.log('request', request);
  if (request.type === 'page-action') {
    setAction(request);
    return;
  }
  if (request.type === 'popup-get-action') {
    sendPopupMessage(lastAction);
    setAction(null);
    sendTabMessage(curTabId, { type: 'popup-opened' });
    return;
  }
  if (request.type === 'download-page') {
    fetchCurrentTab().then(() => {
      (global as any).singlefile.extension.core.bg.business.saveTab(curTab);
    });
    return;
  }
  if (request.type === 'get-content-list') {
    databaseService.getContentList().then(contentList => {
      sendPopupMessage({
        type: 'show-content-list',
        data: contentList,
      });
    });
    return;
  }
  if (request.type === 'get-peers-list') {
    ipfsService
      .getPeersList()
      .then(contentList => {
        sendPopupMessage({
          type: 'show-peers',
          data: contentList,
        });
      })
      .catch(err => {
        sendPopupMessage({
          type: 'err-peers',
          data: err,
        });
      });
    return;
  }
  if (request.method && _.endsWith(request.method, '.download')) {
    sendPopupMessage({
      type: 'loading',
    });

    ipfsService.saveContent(request.content).then(result => {
      databaseService.addContent({
        contentHash: result.hash,
        size: result.size,
        description: request.filename,
      });

      setAction({ type: 'page-action', method: 'link', data: { contentHash: result.hash, keywords: null } });

      sendPopupMessage({
        type: 'loading-end',
      });

      sendPopupMessage(
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
