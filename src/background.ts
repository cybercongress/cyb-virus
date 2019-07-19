const _ = require('lodash');
const pIteration = require('p-iteration');
const ipfsService = require('./backgroundServices/ipfs');
const base36Trie = require('@galtproject/geesome-libs/src/base36Trie');
const cheerio = require('cheerio');
const IPFS = require('ipfs');
const axios = require('axios');
// const ipfsClient = require('ipfs-http-client');

import { BackgroundRequest, BackgroundResponse } from './services/backgroundGateway';
import { Settings } from './backgroundServices/types';
import { PermanentStorage, StorageVars } from './services/data';
import Helper from '@galtproject/frontend-core/services/helper';

const databaseService = require('./backgroundServices/database');

let init = false;
function initServices() {
  return databaseService.getSetting(Settings.StorageNodeAddress).then(async address => {
    // await ipfsService.init(ipfsClient(address));
    await ipfsService.init(await promiseMeJsIpfs());
    console.log('ipfs id', await ipfsService.id());
    init = true;
  });
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/workers/ipfsResource.js', { scope: '/workers/ipfs/' })
    .then(async reg => {
      // регистрация сработала
      console.log('Registration succeeded. Scope is ' + reg.scope);
      await navigator.serviceWorker.ready;
      navigator.serviceWorker.controller.postMessage('ipfs-background');
    })
    .catch(function(error) {
      console.error('Registration failed with ' + error);
    });

  navigator.serviceWorker.onmessage = function(event) {
    console.log('background message', event);
    event.ports[0].postMessage('background response');
  };
}

// setInterval(async () => {
//   console.log('worker response', await axios.get('/workers/ipfs/lala'));
// }, 5000)

function promiseMeJsIpfs() {
  return new Promise((resolve, reject) => {
    const ipfs = IPFS.createNode({
      EXPERIMENTAL: {
        pubsub: true,
        ipnsPubsub: true,
      },
    });
    ipfs.once('ready', () => resolve(ipfs));
    ipfs.once('error', err => reject(err));
  });
}

databaseService.init();
initServices();
const waitForInit = async () => {
  if (init) {
    return;
  }
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (init) {
        resolve();
        clearInterval(interval);
      }
    }, 100);
  });
};

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
  console.log('saveExtensionDataAndBindToIpns start');
  const settings = {};
  await pIteration.forEach([Settings.StorageNodeAddress, Settings.StorageNodeKey, Settings.StorageNodeType], async settingName => {
    settings[settingName] = await databaseService.getSetting(settingName);
    if (_.isUndefined(settings[settingName])) {
      settings[settingName] = null;
    }
  });

  const encryptedSeed = await PermanentStorage.getValue(StorageVars.EncryptedSeed);
  if (!encryptedSeed) {
    console.log('there is no encryptedSeed, break saving');
    return;
  }
  const cyberdAccounts = await PermanentStorage.getValue(StorageVars.CyberDAccounts);

  try {
    const contents = {};
    const contentList = await databaseService.getContentList();
    await pIteration.forEach(contentList, async (contentItem, index) => {
      if (!contentItem.manifestHash) {
        contentItem.manifestHash = await ipfsService.saveContentManifest(contentItem);
        await databaseService.updateContentByHash(contentItem.contentHash, { manifestHash: contentItem.manifestHash });
      }
      base36Trie.setNode(contents, index, ipfsService.getObjectRef(contentItem.manifestHash));
      console.log('setNode', contents, index, ipfsService.getObjectRef(contentItem.manifestHash));
    });

    //TODO: last change at
    const extensionsData = {
      version: 'v1',
      contentCount: contentList.length,
      contents,
      settings,
      encryptedSeed,
      cyberdAccounts,
    };
    console.log('extensionsData', extensionsData);

    const extensionDataIpld = await ipfsService.saveIpld(extensionsData);

    if ((await databaseService.getSetting(Settings.StorageExtensionIpld)) === extensionDataIpld) {
      return;
    }

    await databaseService.setSetting(Settings.StorageExtensionIpld, extensionDataIpld);
    await databaseService.setSetting(Settings.StorageExtensionIpldUpdatedAt, Helper.now());

    const extensionIpnsId = await ipfsService.createExtensionIpnsIfNotExists();
    await ipfsService.bindToStaticId(extensionDataIpld, extensionIpnsId);

    await databaseService.setSetting(Settings.StorageExtensionIpnsUpdatedAt, Helper.now());
    await databaseService.setSetting(Settings.StorageExtensionIpldError, null);
    console.log('saveExtensionDataAndBindToIpns finish');
  } catch (e) {
    console.error(e);
    await databaseService.setSetting(Settings.StorageExtensionIpldError, e && e.message ? e.message : e);
  }
}

async function restoreExtensionDataFromIpld(backupIpld) {
  console.log('restoreExtensionDataFromIpld');
  const backupData = await ipfsService.getObject(backupIpld);
  console.log('backupData', backupData);
  await pIteration.forEach([Settings.StorageNodeAddress, Settings.StorageNodeKey, Settings.StorageNodeType], async settingName => {
    return databaseService.setSetting(settingName, backupData.settings[settingName]);
  });

  await PermanentStorage.setValue(StorageVars.EncryptedSeed, backupData.encryptedSeed);
  await PermanentStorage.setValue(StorageVars.CyberDAccounts, backupData.cyberdAccounts);

  for (let i = 0; i < backupData.contentCount; i++) {
    const node = base36Trie.getNode(backupData.contents, i);
    console.log('node', node);
    const manifestHash = node['/'];
    const contentData = await ipfsService.getObject(manifestHash);
    console.log('contentData', contentData);
    contentData.manifestHash = manifestHash;
    contentData.contentHash = contentData.content;
    contentData.previewHash = contentData.preview;
    await databaseService.saveContent(contentData);
  }
}

setInterval(() => {
  saveExtensionDataAndBindToIpns();
}, 1000 * 60); //* 10

fetchCurrentTab();

let lastAction;
onMessage(async (request, sender, sendResponse) => {
  console.log('request', request);
  await waitForInit();
  await fetchCurrentTab();

  const ipfsNode = await promiseMeJsIpfs();

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
    (global as any).singlefile.extension.core.bg.business.saveTab(curTab);
    return;
  }
  if (request.type === BackgroundRequest.SaveContentToList) {
    databaseService
      .saveContent(request.data)
      .then(async data => {
        setAction(null);

        if (data.mimeType === 'text/html') {
          const contentData = await ipfsService.getContent(data.contentHash);

          const $ = cheerio.load(contentData);
          let faviconEL = $('[rel="icon"]');
          if (!faviconEL || !faviconEL.attr('href')) {
            faviconEL = $('[rel="shortcut icon"]');
          }
          if (faviconEL || faviconEL.attr('href')) {
            console.log('favicon', faviconEL.attr('href'));
            const faviconData = faviconEL.attr('href').replace(/^data:image\/.+;base64,/, '');
            console.log('faviconData', faviconData);
            const buf = new Buffer(faviconData, 'base64');
            console.log('faviconBuffer', buf);
            data.previewHash = (await ipfsService.saveContent(buf)).id;
            data.previewMimeType = 'image/x-icon';
          }
        }

        data.manifestHash = await ipfsService.saveContentManifest(data);
        await databaseService.updateContentByHash(data.contentHash, _.pick(data, ['manifestHash', 'previewHash', 'previewMimeType']));

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
    console.log('BackgroundResponse.GetSettings request');
    pIteration
      .forEach(request.data, async settingName => {
        data[settingName] = await databaseService.getSetting(settingName);
      })
      .then(() => {
        console.log('BackgroundResponse.GetSettings response', data);
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
  if (request.type === BackgroundRequest.GetIsBackupExists) {
    ipfsService
      .getBackupIpld()
      .then(data => {
        sendPopupMessage({ type: BackgroundResponse.GetIsBackupExists, data });
      })
      .catch(err => {
        sendPopupMessage({ type: BackgroundResponse.GetIsBackupExists, err: err && err.message });
      });
    return;
  }
  if (request.type === BackgroundRequest.RestoreBackup) {
    restoreExtensionDataFromIpld(request.data)
      .then(() => {
        sendPopupMessage({ type: BackgroundResponse.RestoreBackup });
      })
      .catch(err => {
        sendPopupMessage({ type: BackgroundResponse.RestoreBackup, err: err && err.message });
      });
    return;
  }
  if (request.method && _.endsWith(request.method, '.download')) {
    sendPopupMessage({ type: 'loading' });

    ipfsService.saveContent(request.content).then(result => {
      const data = { contentHash: result.id, keywords: null, description: request.filename, size: result.size, mimeType: 'text/html' };

      setAction({ type: 'page-action', method: 'save-and-link', data });

      sendPopupMessage({ type: 'loading-end' });

      sendPopupMessage({ type: 'page-action', method: 'save-and-link', data }, response => {
        setAction(null);
      });
    });
  }
});
