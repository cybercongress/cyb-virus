import { BackgroundRequest, BackgroundResponse } from './services/backgroundGateway';

const databaseService = require('./backgroundServices/database');
databaseService.init();

import { Settings } from './backgroundServices/types';
import { PermanentStorage, StorageVars } from './services/data';
import Helper from '@galtproject/frontend-core/services/helper';

const ipfsService = require('./backgroundServices/ipfs');
const base36Trie = require('@galtproject/geesome-libs/src/base36Trie');

function initServices() {
  return databaseService.getSetting(Settings.StorageNodeAddress).then(address => {
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

async function saveExtensionDataAndBindToIpns() {
  console.log('saveExtensionDataAndBindToIpns');
  const settings = {};
  await pIteration.forEach([Settings.StorageNodeAddress, Settings.StorageNodeKey, Settings.StorageNodeType], async settingName => {
    settings[settingName] = await databaseService.getSetting(settingName);
    if (_.isUndefined(settings[settingName])) {
      settings[settingName] = null;
    }
  });

  const contents = {};
  const contentList = await databaseService.getContentList();
  await pIteration.forEach(contentList, async (contentItem, index) => {
    if (!contentItem.manifestHash) {
      contentItem.manifestHash = await ipfsService.saveContentManifest(contentItem);
      await databaseService.updateContentByHash(contentItem.contentHash, { manifestHash: contentItem.manifestHash });
    }
    base36Trie.setNode(contents, index, ipfsService.getObjectRef(contentItem.manifestHash));
  });
  const encryptedSeed = await PermanentStorage.getValue(StorageVars.EncryptedSeed);
  const cyberdAccounts = await PermanentStorage.getValue(StorageVars.CyberDAccounts);

  const extensionsData = {
    settings,
    contents,
    encryptedSeed,
    cyberdAccounts,
  };
  console.log('extensionsData', extensionsData);
  const extensionDataIpld = await ipfsService.saveIpld(extensionsData);
  console.log('extensionDataIpld', extensionDataIpld);

  const extensionIpnsId = await ipfsService.createExtensionIpnsIfNotExists();
  console.log('extensionIpnsId', extensionIpnsId);
  try {
    await ipfsService.bindToStaticId(extensionDataIpld, extensionIpnsId);

    await databaseService.setSetting(Settings.StorageExtensionIpd, extensionDataIpld);
    await databaseService.setSetting(Settings.StorageExtensionIpdUpdatedAt, Helper.now());
    await databaseService.setSetting(Settings.StorageExtensionIpdError, null);
  } catch (e) {
    console.error(e);
    await databaseService.setSetting(Settings.StorageExtensionIpdError, e && e.message ? e.message : e);
  }
}

setInterval(() => {
  saveExtensionDataAndBindToIpns();
}, 1000 * 60); // * 5

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
  if (request.type === BackgroundRequest.SaveContentToList) {
    databaseService
      .saveContent(request.data)
      .then(async data => {
        data.manifestHash = await ipfsService.saveContentManifest(data);
        await databaseService.updateContentByHash(data.contentHash, { manifestHash: data.manifestHash });

        sendPopupMessage({ type: BackgroundResponse.SaveContentToList, data: await databaseService.getContentByHash(data.contentHash) });
      })
      .catch(err => {
        sendPopupMessage({ type: BackgroundResponse.SaveContentToList, err: err && err.message });
      });
    return;
  }
  if (request.type === BackgroundRequest.GetContentList) {
    databaseService.getContentList().then(data => {
      sendPopupMessage({ type: BackgroundResponse.GetContentList, data });
    });
    return;
  }
  if (request.type === BackgroundRequest.GetContentByHash) {
    databaseService.getContentByHash(request.data).then(data => {
      sendPopupMessage({ type: BackgroundResponse.GetContentByHash, data });
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
        sendPopupMessage({ type: BackgroundResponse.SetSettings, err: err && err.message });
      });
    return;
  }
  if (request.type === BackgroundRequest.AddIpfsContentArray) {
    pIteration
      .map(request.data, content => ipfsService.saveContent(content).then(res => res.id))
      .then(data => {
        sendPopupMessage({ type: BackgroundResponse.AddIpfsContentArray, data });
      })
      .catch(err => {
        sendPopupMessage({ type: BackgroundResponse.AddIpfsContentArray, err: err && err.message });
      });
    return;
  }
  if (request.type === BackgroundRequest.GetIpfsFileStats) {
    ipfsService
      .getFileStats(request.data)
      .then(data => {
        sendPopupMessage({ type: BackgroundResponse.GetIpfsFileStats, data });
      })
      .catch(err => {
        sendPopupMessage({ type: BackgroundResponse.GetIpfsFileStats, err: err && err.message });
      });
    return;
  }
  if (request.method && _.endsWith(request.method, '.download')) {
    sendPopupMessage({ type: 'loading' });

    ipfsService.saveContent(request.content).then(result => {
      const data = { contentHash: result.id, keywords: null, description: request.filename, size: result.size };

      setAction({ type: 'page-action', method: 'save-and-link', data });

      sendPopupMessage({ type: 'loading-end' });

      sendPopupMessage({ type: 'page-action', method: 'save-and-link', data }, response => {
        setAction(null);
      });
    });
  }
});
