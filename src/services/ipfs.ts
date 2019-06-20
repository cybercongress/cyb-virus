const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('localhost', '5001', { protocol: 'http' });

module.exports = {
  saveContent(content) {
    const bufferContent = Buffer.from(content, 'utf8');

    return ipfs.add([{ content: bufferContent }]).then(async result => {
      await ipfs.pin.add(result[0].hash);
      return result[0];
    });
  },
};
