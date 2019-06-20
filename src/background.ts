import { BackgroundRequest, BackgroundResponse } from './services/backgroundGateway';

const databaseService = require('./backgroundServices/database');
databaseService.init();

import { Settings } from './backgroundServices/types';

const ipfsService = require('./backgroundServices/ipfs');

function initServices() {
  return databaseService.getSetting(Settings.IpfsNodeAddress).then(address => {
    return ipfsService.init(address);
  });
}
initServices();

const _ = require('lodash');
const pIteration = require('p-iteration');

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
  if (request.type === BackgroundRequest.ShowContentList) {
    databaseService.getContentList().then(data => {
      sendPopupMessage({ type: BackgroundResponse.ShowContentList, data });
    });
    return;
  }
  if (request.type === BackgroundRequest.GetPeersList) {
    ipfsService
      .getPeersList()
      .then(data => {
        sendPopupMessage({ type: BackgroundResponse.GetPeersList, data });
      })
      .catch(err => {
        sendPopupMessage({ type: BackgroundResponse.GetPeersList, err: err && err.message });
      });
    return;
  }
  if (request.type === BackgroundRequest.GetSettings) {
    const data = {};
    pIteration
      .forEach(request.data, async settingName => {
        data[settingName] = await databaseService.getSetting(settingName);
      })
      .then(() => {
        sendPopupMessage({ type: BackgroundResponse.GetSettings, data });
      })
      .catch(err => {
        sendPopupMessage({ type: BackgroundResponse.GetSettings, err: err && err.message });
      });
    return;
  }
  if (request.type === BackgroundRequest.SetSettings) {
    pIteration
      .forEach(request.data, setting => databaseService.setSetting(setting.name, setting.value))
      .then(() => initServices())
      .then(() => {
        sendPopupMessage({ type: BackgroundResponse.SetSettings });
      })
      .catch(err => {
        console.error('catch', err);
        sendPopupMessage({ type: BackgroundResponse.SetSettings, err: err && err.message });
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
