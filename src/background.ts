// import store from './store';
// const ipfs = require('ipfs');
// const node = ipfs();
//
// node.on('ready', () => {
//   //ready to use
// })

const _ = require('lodash');
const axios = require('axios');
let $http = axios.create({});
$http.defaults.baseURL = 'https://geesome.galtproject.io:7722';

let cybFolderId;

const loginPromise = $http.post('/v1/login', { username: 'admin', password: 'admin' });
if (loginPromise && loginPromise.then) {
  loginPromise.then(response => {
    $http.defaults.headers['Authorization'] = 'Bearer ' + response.data.apiKey;

    $http
      .get(`/v1/user/file-catalog/`, {
        params: {
          parentItemId: null,
          type: 'folder',
          sortField: 'updatedAt',
          sortDir: 'desc',
          limit: 100,
          offset: 0,
        },
      })
      .then(response => {
        const cybFolder = _.find(response.data, { name: 'cyb' });
        if (cybFolder) {
          cybFolderId = cybFolder.id;
          console.log('cyb folder found', cybFolderId);
        } else {
          $http.post(`/v1/user/file-catalog/create-folder`, { parentItemId: null, name: 'cyb' }).then(response => {
            cybFolderId = response.data.id;
            console.log('cyb folder found', cybFolderId);
          });
        }
      });
  });
}

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
    $http
      .post('/v1/user/save-data', {
        content: request.content,
        folderId: cybFolderId,
        name: request.filename,
      })
      .then(response => {
        (global as any).chrome.runtime.sendMessage({
          type: 'loading-end',
        });
        console.log('save-data', response.data);
        const contentIpfsHash = response.data.storageId;

        setAction({ type: 'page-action', method: 'link', data: { contentHash: contentIpfsHash, keywords: null } });

        (global as any).chrome.runtime.sendMessage(
          {
            type: 'page-action',
            method: 'link',
            data: {
              contentHash: contentIpfsHash,
              keywords: null,
            },
          },
          response => {
            setAction(null);
            // alert('sendMessage response');
          }
        );
      });
  }
});
