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

export enum BackgroundRequest {
  ShowContentList = 'show-content-list:request',
  GetPeersList = 'get-peers-list:request',
  GetSettings = 'get-settings:request',
  SetSettings = 'set-settings:request',
}

export enum BackgroundResponse {
  ShowContentList = 'show-content-list:response',
  GetPeersList = 'get-peers-list:response',
  GetSettings = 'get-settings:response',
  SetSettings = 'set-settings:response',
}

export function showContent() {
  const resultPromise = onMessagePromise(BackgroundResponse.ShowContentList);

  sendMessage({ type: BackgroundRequest.ShowContentList });

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
