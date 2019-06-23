document.addEventListener('cyb:link', function(data: any) {
  // alert(JSON.stringify(data.detail));
  (global as any).chrome.runtime.sendMessage(
    {
      type: 'page-action',
      method: 'link-hash',
      data: data.detail,
    },
    response => {
      // alert('sendMessage response');
    }
  );
});

const fetchResource = ((window as any).singlefile.lib.fetch.content.resources && (window as any).singlefile.lib.fetch.content.resources.fetch) || fetch;

async function srcToBase64(src) {
  const resourceContent = await fetchResource(src, {});
  const arrayBuffer = await resourceContent.arrayBuffer();
  let b64encoded = btoa(
    [].reduce.call(
      new Uint8Array(arrayBuffer),
      function(p, c) {
        return p + String.fromCharCode(c);
      },
      ''
    )
  );
  let mimeType = resourceContent.headers.get('content-type');
  return {
    content: 'data:' + mimeType + ';base64,' + b64encoded,
    mimeType,
    url: resourceContent.url,
  };
}

document.addEventListener('cyb:save', async function(data: any) {
  const base64 = await srcToBase64(data.detail.src);

  const messageData = {
    mimeType: base64.mimeType,
    content: base64.content,
    src: base64.url,
    description: data.detail.description,
    keywords: data.detail.keywords,
  };
  (global as any).chrome.runtime.sendMessage({ type: 'page-action', method: 'save-content', data: messageData });
});

const initEvent = document.createEvent('Event');
initEvent.initEvent('cyb:init');
document.dispatchEvent(initEvent);
// console.log('dispatchEvent', initEvent);

(global as any).chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // alert('onMessage: ' + JSON.stringify(request));
  if (request.type === 'popup-opened') {
    const initEvent = document.createEvent('Event');
    initEvent.initEvent('cyb:popup-opened');
    document.dispatchEvent(initEvent);
  }
});

const inpageJs = document.createElement('script');
inpageJs.src = chrome.runtime.getURL('inpage.js');
inpageJs.onload = function() {
  this['remove']();
};
(document.head || document.documentElement).appendChild(inpageJs);
