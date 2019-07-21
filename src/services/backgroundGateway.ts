function sendMessage(data) {
  (global as any).chrome.runtime.sendMessage(data);
}

function onMessage(type, callback) {
  (global as any).chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || request.type != type) {
      return;
    }
    callback(request);
  });
}

function onMessagePromise(type) {
  return new Promise((resolve, reject) => {
    onMessage(type, result => (result.err ? reject(result.err) : resolve(result.data)));
  });
}

//TODO: solve problem with parallel requests

export enum BackgroundRequest {
  SaveContentToList = 'save-content-to-list:request',
  GetContentList = 'get-content-list:request',
  GetContentByHash = 'get-content-by-hash:request',
  GetContentDataByHash = 'get-content-data-by-hash:request',
  GetPeersList = 'get-peers-list:request',
  GetSettings = 'get-settings:request',
  SetSettings = 'set-settings:request',
  AddIpfsContentArray = 'add-ipfs-content-array:request',
  GetIpfsFileStats = 'get-ipfs-file-stats:request',
  GetIsBackupExists = 'get-is-backup-exists:request',
  RestoreBackup = 'restore-backup:request',
}

export enum BackgroundResponse {
  SaveContentToList = 'save-content-to-list:response',
  GetContentList = 'get-content-list:response',
  GetContentByHash = 'get-content-by-hash:response',
  GetContentDataByHash = 'get-content-data-by-hash:response',
  GetPeersList = 'get-peers-list:response',
  GetSettings = 'get-settings:response',
  SetSettings = 'set-settings:response',
  AddIpfsContentArray = 'add-ipfs-content-array:response',
  GetIpfsFileStats = 'get-ipfs-file-stats:response',
  GetIsBackupExists = 'get-is-backup-exists:response',
  RestoreBackup = 'restore-backup:response',
}

export function saveContent(data) {
  const resultPromise = onMessagePromise(BackgroundResponse.SaveContentToList);

  sendMessage({ type: BackgroundRequest.SaveContentToList, data });

  return resultPromise;
}

export function getContentList() {
  const resultPromise = onMessagePromise(BackgroundResponse.GetContentList);

  sendMessage({ type: BackgroundRequest.GetContentList });

  return resultPromise;
}

export function getContentByHash(hash) {
  const resultPromise = onMessagePromise(BackgroundResponse.GetContentByHash);

  sendMessage({ type: BackgroundRequest.GetContentByHash, data: hash });

  return resultPromise;
}

export function getContentDataByHash(hash) {
  const resultPromise = onMessagePromise(BackgroundResponse.GetContentDataByHash);

  sendMessage({ type: BackgroundRequest.GetContentDataByHash, data: hash });

  return resultPromise;
}

export function getIpfsFileStats(file) {
  const resultPromise = onMessagePromise(BackgroundResponse.GetIpfsFileStats);

  sendMessage({ type: BackgroundRequest.GetIpfsFileStats, data: file });

  return resultPromise;
}

export function getPeers() {
  const resultPromise = onMessagePromise(BackgroundResponse.GetPeersList);

  sendMessage({ type: BackgroundRequest.GetPeersList });

  return resultPromise;
}

export function getSettings(settingsNamesArr) {
  const resultPromise = onMessagePromise(BackgroundResponse.GetSettings);

  sendMessage({ type: BackgroundRequest.GetSettings, data: settingsNamesArr });

  return resultPromise;
}

export function setSettings(settingsNameValueArr) {
  const resultPromise = onMessagePromise(BackgroundResponse.SetSettings);

  sendMessage({ type: BackgroundRequest.SetSettings, data: settingsNameValueArr });

  return resultPromise;
}

export function addIpfsContentArray(contentList) {
  const resultPromise = onMessagePromise(BackgroundResponse.AddIpfsContentArray);

  sendMessage({ type: BackgroundRequest.AddIpfsContentArray, data: contentList });

  return resultPromise;
}

export function getIsBackupExists() {
  const resultPromise = onMessagePromise(BackgroundResponse.GetIsBackupExists);

  sendMessage({ type: BackgroundRequest.GetIsBackupExists });

  return resultPromise;
}

export function restoreBackup(ipld) {
  const resultPromise = onMessagePromise(BackgroundResponse.RestoreBackup);

  sendMessage({ type: BackgroundRequest.RestoreBackup, data: ipld });

  return resultPromise;
}
