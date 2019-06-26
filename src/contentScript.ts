const regex = require('./services/regex');

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

const fetchResource =
  ((window as any).singlefile && (window as any).singlefile.lib.fetch.content.resources && (window as any).singlefile.lib.fetch.content.resources.fetch) || fetch;

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
  let contentType = data.detail.contentType;
  let mimeType;
  let content;
  let src;

  if (contentType === 'image') {
    let base64;
    if (data.detail.src.match(regex.base64)) {
      base64 = { content: data.detail.src, mimeType: data.detail.src.match(/^data:(.+);.+/)[1] };
    } else {
      base64 = await srcToBase64(data.detail.src);
    }
    mimeType = base64.mimeType;
    content = base64.content;
    src = base64.url;
  } else {
    src = data.detail.src;
  }

  let iconBase64;
  if (data.detail.iconSrc) {
    if (data.detail.iconSrc.match(regex.base64)) {
      iconBase64 = { content: data.detail.iconSrc, mimeType: data.detail.iconSrc.match(/^data:(.+);.+/)[1] };
    } else {
      iconBase64 = await srcToBase64(data.detail.iconSrc);
    }
  }

  const messageData = {
    contentType,
    mimeType,
    content,
    src,
    iconContent: iconBase64 ? iconBase64.content : null,
    iconMimeType: iconBase64 ? iconBase64.mimeType : null,
    description: data.detail.description,
    keywords: data.detail.keywords,
    link: data.detail.link,
  };
  (global as any).chrome.runtime.sendMessage({ type: 'page-action', method: 'save-content', data: messageData });
});

document.addEventListener('cyb:is-content-exists', async function(data: any) {
  const base64 = await srcToBase64(data.detail.src);
  // alert(JSON.stringify(data.detail));
  (global as any).chrome.runtime.sendMessage({
    type: 'is-content-exists:request',
    data: {
      content: base64.content,
    },
  });
});

const initEvent = document.createEvent('Event');
initEvent.initEvent('cyb:init');
document.dispatchEvent(initEvent);
// console.log('dispatchEvent', initEvent);

(global as any).chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // alert('onMessage: ' + JSON.stringify(request));
  console.log('onMessage', request);
  if (request.type === 'popup-opened') {
    const initEvent = document.createEvent('Event');
    initEvent.initEvent('cyb:popup-opened');
    document.dispatchEvent(initEvent);
  }
  if (request.type === 'is-content-exists:response') {
    const event = new CustomEvent('cyb:is-content-exists:response', {
      detail: request.data,
    });
    document.dispatchEvent(event);
  }
});

const inpageJs = document.createElement('script');
inpageJs.src = chrome.runtime.getURL('inpage.js');
inpageJs.onload = function() {
  this['remove']();
};
(document.head || document.documentElement).appendChild(inpageJs);
