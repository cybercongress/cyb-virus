document.addEventListener('cyb:link', function(data: any) {
  // alert(JSON.stringify(data.detail));
  // alert('cyb:link');
  (global as any).chrome.runtime.sendMessage({ type: 'page-action', method: 'link', data: data.detail }, response => {
    // alert('sendMessage response');
  });
});

const initEvent = document.createEvent('Event');
initEvent.initEvent('cyb:init');
document.dispatchEvent(initEvent);
// console.log('dispatchEvent', initEvent);
