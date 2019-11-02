const sjcl = require('sjcl');
const _ = require('lodash');
const ethers = require('ethers');
const bip39 = require('bip39');
const regex = require('./regex');

const Unixfs = require('ipfs-unixfs');
const { DAGNode, util: DAGUtil } = require('ipld-dag-pb');

const cyberjsCrypto = require('@litvintech/cyberjs/crypto');

export enum CoinType {
  Cosmos = 'cosmos',
  Ether = 'ether',
}

export enum Network {
  Geesome = 'geesome',
  CyberD = 'cyberd',
}

export enum StorageVars {
  Ready = 'ready',
  EncryptedSeed = 'encryptedSeed',
  Path = 'path',
  Query = 'query',
  CoinType = 'coinType',
  Network = 'network',
  NetworkList = 'networkList',
  Account = 'account',
  CurrentAccounts = 'current:accounts',
  CyberDAccounts = 'cyberd:accounts',
  GeesomeAccounts = 'geesome:accounts',
  IpfsUrl = 'ipfs:url',
  CurrentCabinetRoute = 'current:cabinet',
  Settings = 'settings',
  ExtensionTabPageUrl = 'extension-tab-page-url',
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
      // console.log('setValue', name, value);
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
        // console.log('getValue', name, result[name]);
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

export class AppWallet {
  static $store;

  static setStore($store) {
    this.$store = $store;
  }

  static async generateAccount(coinType, index) {
    const encryptedSeed = await PermanentStorage.getValue(StorageVars.EncryptedSeed);
    const password = await this.getPassword();
    const seed = AppCrypto.decrypt(encryptedSeed, password);

    if (coinType === CoinType.Ether) {
      const wallet = ethers.Wallet.fromMnemonic(seed, `m/44'/60'/0'/0/${index}`);
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
      };
    } else if (coinType === CoinType.Cosmos) {
      //TODO: use index
      return cyberjsCrypto.recover(seed, 'en');
    }
    return null;
    // const hdkey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'));
    // const childkey = hdkey.derive(`m/44'/60'/0'/0/${index}`);
    // return {
    //   privateKey: childkey.privateExtendedKey,
    //   publicKey: childkey.publicExtendedKey
    // }
  }

  static async getAccountByPrivateKey(coinType, privateKey) {
    if (coinType === CoinType.Ether) {
      const wallet = new ethers.Wallet(privateKey);
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
      };
    } else if (coinType === CoinType.Cosmos) {
      return cyberjsCrypto.importAccount(privateKey);
    }
    return null;
  }

  static async setPassword(password) {
    return PermanentStorage.setValue('password', password);
  }

  static async getPassword() {
    return PermanentStorage.getValue('password');
  }

  static generateSeed() {
    return bip39.generateMnemonic();
  }

  static async setSeed(seed, password) {
    this.$store.commit(StorageVars.EncryptedSeed, AppCrypto.encrypt(seed, password));
    return this.setPassword(password);
  }

  static async addAccount(storageVar, address, privateKey, additionalData = {}) {
    const accounts = _.clone(this.$store.state[storageVar]) || [];

    if (_.some(accounts, { address })) {
      //already exists
      return;
    }

    const newAccount = _.extend(
      {
        address: address,
        encryptedPrivateKey: await this.encryptByPassword(privateKey),
      },
      additionalData
    );

    accounts.push(newAccount);
    this.$store.commit(storageVar, accounts);
    this.$store.commit(StorageVars.Account, newAccount);
  }

  static async encryptByPassword(data) {
    return AppCrypto.encrypt(data, await this.getPassword());
  }

  static async decryptByPassword(encryptedData) {
    return AppCrypto.decrypt(encryptedData, await this.getPassword());
  }
}

export function getIpfsHash(string) {
  if (string.match(regex.base64)) {
    string = new Buffer(string.replace(regex.base64, ''), 'base64');
  }
  return new Promise((resolve, reject) => {
    const unixFsFile = new Unixfs('file', Buffer.from(string));
    const buffer = unixFsFile.marshal();

    DAGNode.create(buffer, (err, dagNode) => {
      if (err) {
        reject(new Error('Cannot create ipfs DAGNode'));
      }

      DAGUtil.cid(dagNode, (error, cid) => {
        resolve(cid.toBaseEncodedString());
      });
    });
  });
}
