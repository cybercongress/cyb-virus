import Helper from '@galtproject/frontend-core/services/helper';

const _ = require('lodash');

const Unixfs = require('ipfs-unixfs');
const { DAGNode, util: DAGUtil } = require('ipld-dag-pb');

const cybCrypto = require('../crypto');

export enum CoinType {
  CyberD = 'cyberd',
  Ether = 'ether',
  Binance = 'binance',
  Irisnet = 'irisnet',
  Terra = 'terra',
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
  AccountsGroups = 'accounts:groups',
  AllAccounts = 'accounts:all',
  CurrentAccounts = 'accounts:current',
  // CyberDAccounts = 'cyberd:accounts',
  // GeesomeAccounts = 'geesome:accounts',
  IpfsUrl = 'ipfs:url',
  CurrentCabinetRoute = 'current:cabinet',
  Settings = 'settings',
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

export class AppWallet {
  static $store;

  static setStore($store) {
    this.$store = $store;
  }

  static async generateAccount(coinType, index) {
    const encryptedSeed = await PermanentStorage.getValue(StorageVars.EncryptedSeed);
    const password = await this.getPassword();
    const mnemonic = cybCrypto.decrypt(encryptedSeed, password);

    if (coinType === CoinType.Ether) {
    } else if (coinType === CoinType.CyberD) {
      return cybCrypto.getEthereumKeypairByMnemonic(mnemonic, index);
    } else if (coinType === CoinType.Binance) {
      return cybCrypto.getBinanceKeypairByMnemonic(mnemonic, index);
    } else if (coinType === CoinType.Irisnet) {
      return cybCrypto.getIrisnetKeypairByMnemonic(mnemonic, index);
    } else if (coinType === CoinType.Terra) {
      return cybCrypto.getTerraKeypairByMnemonic(mnemonic, index);
    }
    return null;
  }

  static async getAccountByPrivateKey(coinType, privateKey) {
    if (coinType === CoinType.Ether) {
      return cybCrypto.getEthereumKeypairByPrivateKey(privateKey);
    } else if (coinType === CoinType.CyberD) {
      return cybCrypto.getCyberKeypairByPrivateKey(privateKey);
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
    return cybCrypto.generateMnemonic();
  }

  static async setSeed(seed, password) {
    this.$store.commit(StorageVars.EncryptedSeed, cybCrypto.encrypt(seed, password));
    return this.setPassword(password);
  }

  static async addAccountGroup(title) {
    const accountsGroups = _.clone(this.$store.state[StorageVars.AccountsGroups]) || [];
    const newGroup = {
      title,
      derivationIndex: accountsGroups.length,
      id: Helper.uuidv4(),
    };
    accountsGroups.push(newGroup);
    this.$store.commit(StorageVars.AccountsGroups, accountsGroups);
    return newGroup;
  }

  static async addAccount(groupId, address, coinType, privateKey, additionalData = {}) {
    const accounts = _.clone(this.$store.state[StorageVars.AllAccounts]) || [];

    if (_.some(accounts, { address, groupId })) {
      //already exists
      return;
    }

    const newAccount = _.extend(
      {
        address,
        coinType,
        encryptedPrivateKey: await this.encryptByPassword(privateKey),
      },
      additionalData
    );

    accounts.push(newAccount);
    this.$store.commit(StorageVars.AllAccounts, accounts);
  }

  static async encryptByPassword(data) {
    return cybCrypto.encrypt(data, await this.getPassword());
  }

  static async decryptByPassword(encryptedData) {
    return cybCrypto.decrypt(encryptedData, await this.getPassword());
  }
}

export function getIpfsfHash(string) {
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
