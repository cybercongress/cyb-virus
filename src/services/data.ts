const sjcl = require('sjcl');
const _ = require('lodash');

export enum Network {
  Geesome = 'geesome',
  CyberD = 'cyberd',
}

export enum StorageVars {
  EncryptedSeed = 'encryptedSeed',
  Path = 'path',
  Network = 'network',
  NetworkList = 'networkList',
  Account = 'account',
}

export class PermanentStorage {
  static pseudoStorage = {};

  static async setValue(name, value) {
    return new Promise((resolve, reject) => {
      if (!(global as any).chrome.storage) {
        this.pseudoStorage[name] = value;
        return resolve();
      }
      if (_.isObject(value)) {
        value = JSON.stringify(value);
      }
      (global as any).chrome.storage.sync.set({ [name]: value }, function() {
        resolve();
      });
    });
  }

  static async getValue(name) {
    return new Promise((resolve, reject) => {
      if (!(global as any).chrome.storage) {
        return resolve(this.pseudoStorage[name]);
      }
      (global as any).chrome.storage.sync.get([name], function(result) {
        resolve(result[name]);
      });
    });
  }
}

export class AppCrypto {
  static encrypt(data, password) {
    return sjcl.encrypt(password, data);
  }
  static decrypt(encryptedData, password) {
    return sjcl.decrypt(password, encryptedData);
  }
}
