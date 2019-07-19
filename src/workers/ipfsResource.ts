console.log('ipfsResource start');

self.addEventListener('fetch', function(event: any) {
  (self as any).clients.matchAll().then(function(clients) {
    const ipfsHash = event.request.url.split('/ipfs/')[1];
    console.log('fetch ipfsHash', ipfsHash);
    const response = new Response('Ipfs hash: ' + ipfsHash, {
      headers: { 'Content-Type': 'text/html' },
    });
    (event as any).respondWith(response);

    let client = clients[0];

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = function(event) {
      console.log('ipfsResource onmessage', event);
    };

    client.postMessage('ipfsResource request', [messageChannel.port2]);
  });
});
