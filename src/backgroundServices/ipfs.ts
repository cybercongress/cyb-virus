import { JsIpfsService } from '@galtproject/geesome-libs/src/JsIpfsService';
const ipfsClient = require('ipfs-http-client');
const pull = require('pull-stream');
let ipfs;
let ipfsService;

const extensionIpns = 'cybvirusex';

module.exports = {
  init(options) {
    ipfs = ipfsClient(options);
    ipfsService = new JsIpfsService(ipfs);
  },
  saveContent(content) {
    return ipfsService.saveFileByData(content);
  },
  async saveIpld(objectData) {
    return ipfsService.saveObject(objectData);
  },
  async getObject(storageId) {
    return ipfsService.getObject(storageId);
  },
  async getObjectProp(storageId, propName) {
    return ipfsService.getObjectProp(storageId, propName);
  },

  async bindToStaticId(storageId, accountKey) {
    return ipfsService.bindToStaticId(storageId, accountKey);
  },

  async saveContentManifest(contentObj) {
    return this.saveIpld(_.pick(contentObj, ['contentHash', 'description', 'size', 'createdAt']));
  },

  async getFileStats(file) {
    //TODO: make it work
    // return ipfs.files.stat('/' + file);
    return new Promise((resolve, reject) => {
      pull(
        ipfs.lsPullStream(file),
        pull.collect((err, files) => {
          if (err) {
            throw err;
          }

          console.log('result', file, files);
          return resolve(files[0]);
        })
      );
    });
  },
  getPeersList() {
    return ipfsService.getBootNodeList();
  },
  createExtensionIpnsIfNotExists() {
    return ipfsService.createAccountIfNotExists(extensionIpns);
  },
  getExtensionIpns() {
    return ipfsService.getAccountIdByName(extensionIpns);
  },
  getObjectRef(id) {
    return ipfsService.getObjectRef(id);
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
