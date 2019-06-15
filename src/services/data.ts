const sjcl = require('sjcl');
// const SimpleCrypto = require("simple-crypto-js").default;
const _ = require('lodash');
const ethers = require('ethers');
const bip39 = require('bip39');
const KeyPair = require('shr-keys').KeyPair;

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
  AccountList = 'cyberd:accounts',
  GeesomeAccounts = 'geesome:accounts',
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
      console.log('setValue', name, value);
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
        console.log('getValue', name, result[name]);
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

  static async getAccount(coinType, index) {
    const encryptedSeed = await PermanentStorage.getValue(StorageVars.EncryptedSeed);
    const password = await this.getPassword();
    const seed = AppCrypto.decrypt(encryptedSeed, password);

    if (coinType === 'ether') {
      const wallet = ethers.Wallet.fromMnemonic(seed, `m/44'/60'/0'/0/${index}`);
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
      };
    } else if (coinType === 'cosmos') {
      //TODO: use index
      let keyPair = KeyPair.fromMnemonic(seed);
      return {
        address: keyPair.address,
        privateKey: keyPair.privKey,
      };
    }
    return null;
    // const hdkey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'));
    // const childkey = hdkey.derive(`m/44'/60'/0'/0/${index}`);
    // return {
    //   privateKey: childkey.privateExtendedKey,
    //   publicKey: childkey.publicExtendedKey
    // }
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

  static async encryptByPassword(data) {
    return AppCrypto.encrypt(data, await this.getPassword());
  }

  static async decryptByPassword(encryptedData) {
    return AppCrypto.decrypt(encryptedData, await this.getPassword());
  }
}
