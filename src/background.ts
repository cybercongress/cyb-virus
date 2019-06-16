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
// console.log('$http.post', $http.post('/v1/login', {username: 'admin', password: 'admin'}));

$http.post('/v1/login', { username: 'admin', password: 'admin' }).then(response => {
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
          cybFolderId = cybFolder.id;
          console.log('cyb folder found', cybFolderId);
        });
      }
    });
})(global as any).browser = require('webextension-polyfill');

let curTabId;
let curTab;

(global as any).chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
  curTab = tabs[0];
  curTabId = curTab.id;
});

let lastAction;
(global as any).browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'page-action') {
    lastAction = request;
    (global as any).chrome.browserAction.setBadgeText({ text: '!' });
  }
  if (request.type === 'popup-get-action') {
    if (!sendResponse) {
      return;
    }
    sendResponse(lastAction);
    lastAction = null;
    (global as any).chrome.browserAction.setBadgeText({ text: '' });
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
    $http.post('/v1/user/save-data', { content: request.content, folderId: cybFolderId, name: request.url.replace('http://', '').replace('https://', '') }).then(response => {
      console.log('save-data', response.data);
    });
    // axios.post()
  }
  // if (request.type === 'get-ipfs') {
  //   sendResponse(lastAction);
  // }
});
