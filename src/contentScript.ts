document.addEventListener('cyb:link', function(data: any) {
  // alert(JSON.stringify(data.detail));
  (global as any).chrome.runtime.sendMessage({ type: 'page-action', method: 'link', data: data.detail }, response => {
    // alert('sendMessage response');
  });
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
