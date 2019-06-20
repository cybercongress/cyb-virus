const ipfsClient = require('ipfs-http-client');
let ipfs;

module.exports = {
  init(options) {
    ipfs = ipfsClient(options);
  },
  saveContent(content) {
    const bufferContent = Buffer.from(content, 'utf8');

    return ipfs.add([{ content: bufferContent }]).then(async result => {
      await ipfs.pin.add(result[0].hash);
      return result[0];
    });
  },
  getPeersList() {
    return new Promise((resolve, reject) => {
      ipfs.bootstrap.list((err, res) => (err ? reject(err) : resolve(res.Peers)));
    });
  },
};

// geesome.saveData(request.content, request.filename).then(ipfsHash => {
//   setAction({ type: 'page-action', method: 'link', data: { contentHash: ipfsHash, keywords: null } });
//
// (global as any).chrome.runtime.sendMessage({
//   type: 'loading-end',
// });
//   (global as any).chrome.runtime.sendMessage(
//     {
//       type: 'page-action',
//       method: 'link',
//       data: {
//         contentHash: ipfsHash,
//         keywords: null,
//       },
//     },
//     response => {
//       setAction(null);
//     }
//   );
// });
