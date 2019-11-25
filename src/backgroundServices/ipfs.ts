export {};
import { JsIpfsService } from '@galtproject/geesome-libs/src/JsIpfsService';
const pull = require('pull-stream');
const _ = require('lodash');
const regex = require('../services/regex');
let ipfs;
let ipfsService;

const extensionIpns = 'cybvirusex';

module.exports = {
  init(ipfsNode) {
    ipfs = ipfsNode;
    ipfsService = new JsIpfsService(ipfsNode);
  },
  id() {
    return ipfs.id();
  },
  saveContent(content) {
    if (content.match(regex.base64)) {
      content = new Buffer(content.replace(regex.base64, ''), 'base64');
    }
    return ipfsService.saveFileByData(content);
  },
  getContent(content) {
    return ipfsService.getFileData(content);
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
  async resolveStaticId(accountKey) {
    return ipfsService.resolveStaticId(accountKey);
  },

  async saveContentManifest(contentObj) {
    const fields = ['description', 'size', 'mimeType', 'previewMimeType', 'view', 'extension', 'previewExtension'];
    const objToSave = _.pick(contentObj, fields);

    fields.forEach(field => {
      if (_.isUndefined(objToSave[field])) {
        delete objToSave[field];
      }
    });

    objToSave.content = contentObj.contentHash;
    if (contentObj.iconHash) {
      objToSave.icon = contentObj.iconHash;
    }
    console.log('objToSave', objToSave);

    return this.saveIpld(objToSave);
  },

  async getBackupIpld() {
    const extensionIpnsId = await this.createExtensionIpnsIfNotExists();
    const result = await ipfsService.resolveStaticId(extensionIpnsId);
    return result === extensionIpnsId ? null : result;
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
