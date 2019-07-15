import Helper from '@galtproject/frontend-core/services/helper';
import { AppAccount, AppAccountGroup } from '../interface';
import { KeyPairType, StorageVars } from '../enum';

const _ = require('lodash');
const pIteration = require('p-iteration');

const Unixfs = require('ipfs-unixfs');
const { DAGNode, util: DAGUtil } = require('ipld-dag-pb');

const cybCrypto = require('../crypto');
const appConfig = require('../config');

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

  static async generateAccount(coinType, index): Promise<AppAccount> {
    const encryptedSeed = await PermanentStorage.getValue(StorageVars.EncryptedSeed);
    const password = await this.getPassword();
    const mnemonic = cybCrypto.decrypt(encryptedSeed, password);

    if (coinType === KeyPairType.Ether) {
      return cybCrypto.getEthereumKeypairByMnemonic(mnemonic, index);
    } else if (coinType === KeyPairType.Cyber) {
      return cybCrypto.getCyberDKeypairByMnemonic(mnemonic, index);
    } else if (coinType === KeyPairType.Binance) {
      return cybCrypto.getBinanceKeypairByMnemonic(mnemonic, index);
    } else if (coinType === KeyPairType.Irisnet) {
      return cybCrypto.getIrisnetKeypairByMnemonic(mnemonic, index);
    } else if (coinType === KeyPairType.Terra) {
      return cybCrypto.getTerraKeypairByMnemonic(mnemonic, index);
    }
    return null;
  }

  static async getAccountByPrivateKey(coinType, privateKey): Promise<AppAccount> {
    if (coinType === KeyPairType.Ether) {
      return cybCrypto.getEthereumKeypairByPrivateKey(privateKey);
    } else if (coinType === KeyPairType.Cyber) {
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

  static async addAccountGroup(title): Promise<AppAccountGroup> {
    const accountsGroups = _.clone(this.$store.state[StorageVars.AccountsGroups]) || [];

    let lastIndex = 0;

    if (accountsGroups.length > 0) {
      accountsGroups.forEach(account => {
        if (account.derivationIndex > lastIndex) {
          lastIndex = account.derivationIndex;
        }
      });
      lastIndex += 1;
    }

    const newGroup: AppAccountGroup = {
      title,
      derivationIndex: lastIndex,
      id: Helper.uuidv4(),
    };
    accountsGroups.push(newGroup);

    this.$store.commit(StorageVars.AccountsGroups, accountsGroups);

    return newGroup;
  }

  static async generateBaseCoinsForAccountGroup(groupId): Promise<AppAccount[]> {
    const accountGroup = this.getAccountGroupById(groupId);

    return pIteration.map(appConfig.baseKeyPairs, async coinType => {
      const newAccount = await AppWallet.generateAccount(coinType, accountGroup.derivationIndex);
      return AppWallet.addAccount(groupId, coinType, appConfig.defaultNetworksByKeyPairType[coinType], newAccount.address, newAccount.privateKey);
    });
  }

  static getAccountGroupById(groupId): AppAccountGroup {
    return _.find(this.$store.state[StorageVars.AccountsGroups], { id: groupId });
  }

  static getAccountListByGroupById(groupId): AppAccount[] {
    return _.filter(this.$store.state[StorageVars.AllAccounts], { groupId });
  }

  static async addAccount(groupId, networkName, coinType, address, privateKey, additionalData = {}): Promise<AppAccount> {
    const accounts = _.clone(this.$store.state[StorageVars.AllAccounts]) || [];

    if (_.some(accounts, { address, groupId })) {
      //already exists
      return;
    }

    const groupAccounts = this.getAccountListByGroupById(groupId);

    let lastPosition = 0;
    if (groupAccounts.length > 0) {
      groupAccounts.forEach(account => {
        if (account.position > lastPosition) {
          lastPosition = account.position;
        }
      });
      lastPosition += 1;
    }

    const newAccount: AppAccount = _.extend(
      {
        address,
        coinType,
        groupId,
        networkName,
        position: lastPosition,
        encryptedPrivateKey: await this.encryptByPassword(privateKey),
      },
      additionalData
    );

    accounts.push(newAccount);
    this.$store.commit(StorageVars.AllAccounts, accounts);
    return newAccount;
  }

  static setCurrentAccountItem(accountItem: AppAccount) {
    this.$store.commit(StorageVars.CurrentAccountItem, accountItem);
  }
  static setCurrentAccountGroup(accountGroup: AppAccountGroup) {
    this.$store.commit(StorageVars.CurrentAccountGroup, accountGroup);
    const accountList = this.getAccountListByGroupById(accountGroup.id);
    this.$store.commit(StorageVars.CurrentAccountList, accountList);
    this.setCurrentAccountItem(accountList[0]);
  }
  static setCurrentAccountGroupById(groupId) {
    this.setCurrentAccountGroup(this.getAccountGroupById(groupId));
  }

  static async encryptByPassword(data) {
    return cybCrypto.encrypt(data, await this.getPassword());
  }

  static async decryptByPassword(encryptedData) {
    return cybCrypto.decrypt(encryptedData, await this.getPassword());
  }
}

export function getIpfsHash(string) {
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
