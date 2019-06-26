const _ = require('lodash');
const pIteration = require('p-iteration');
const ipfsService = require('./backgroundServices/ipfs');
const base36Trie = require('@galtproject/geesome-libs/src/base36Trie');
const cheerio = require('cheerio');

import { BackgroundRequest, BackgroundResponse } from './services/backgroundGateway';
import { Settings } from './backgroundServices/types';
import { getIpfsHash, PermanentStorage, StorageVars } from './services/data';
import Helper from '@galtproject/frontend-core/services/helper';

const databaseService = require('./backgroundServices/database');

let init = false;

function initServices() {
  return databaseService.getSetting(Settings.StorageNodeAddress).then(async address => {
    await ipfsService.init(address);
    init = true;
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

async function saveContentToIpfs(content, description, mimeType) {
  return ipfsService.saveContent(content).then(result => {
    return { contentHash: result.id, keywords: null, description, size: result.size, mimeType };
  });
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
    contentData.iconHash = contentData.icon;
    await databaseService.saveContent(contentData);
  }
}

setInterval(() => {
  saveExtensionDataAndBindToIpns();
}, 1000 * 60 * 5);

fetchCurrentTab();

let lastAction;
onMessage((request, sender, sendResponse) => {
  (async () => {
    console.log('request', request);
    await waitForInit();

    if (request.type === 'page-action') {
      if (request.method === 'save-content') {
        if (request.data.contentType === 'video') {
          //TODO: download video to IPFS
        }
        saveContentToIpfs(request.data.content, request.data.description, request.data.mimeType).then(async data => {
          if (request.data.iconContent) {
            data.iconHash = (await ipfsService.saveContent(request.data.iconContent)).id;
            data.iconMimeType = request.data.iconMimeType;
          }
          await databaseService.saveContent(data);
          const manifestHash = await ipfsService.saveContentManifest(data);
          await databaseService.updateContentByHash(data.contentHash, { manifestHash });
          if (request.data.link) {
            setAction({
              type: 'page-action',
              method: 'link',
              data: {
                keywords: request.data.keywords,
                contentHash: data.contentHash,
              },
            });
          }
        });
      } else if (request.method === 'link-hash') {
        setAction({ type: 'page-action', method: 'link', data: request.data });
      }
      return;
    }
    if (request.type === 'is-content-exists:request') {
      let contentHash = request.data.contentHash;
      if (!contentHash) {
        contentHash = await getIpfsHash(request.data.content);
      }
      const contentObj = await databaseService.getContentByHash(contentHash);

      sendTabMessage(curTabId, { type: 'is-content-exists:response', data: !!contentObj });
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
          setAction(null);

          if (data.mimeType === 'text/html' && !data.iconHash) {
            const contentData = await ipfsService.getContent(data.contentHash);

            const $ = cheerio.load(contentData);
            let faviconEL = $('[rel="icon"]');
            if (!faviconEL || !faviconEL.attr('href')) {
              faviconEL = $('[rel="shortcut icon"]');
            }
            if (faviconEL || faviconEL.attr('href')) {
              data.iconHash = (await ipfsService.saveContent(faviconEL.attr('href'))).id;
              data.iconMimeType = 'image/x-icon';
            }
          }

          data.manifestHash = await ipfsService.saveContentManifest(data);
          await databaseService.updateContentByHash(data.contentHash, _.pick(data, ['manifestHash', 'iconMimeType', 'iconHash']));

          sendPopupMessage({
            type: BackgroundResponse.SaveContentToList,
            data: await databaseService.getContentByHash(data.contentHash),
          });
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

      saveContentToIpfs(request.content, request.filename, 'text/html').then(data => {
        setAction({ type: 'page-action', method: 'save-and-link', data });

        sendPopupMessage({ type: 'loading-end' });

        sendPopupMessage({ type: 'page-action', method: 'save-and-link', data }, response => {
          setAction(null);
        });
      });
    }
  })();
  return true;
});
