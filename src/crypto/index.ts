export {};

const ethers = require('ethers');
const bip39 = require('bip39');
const jsCosmosEncoding = require('js-cosmos/dist/utils/encoding');
const cyberDConfig = require('js-cosmos/dist/config/cyberd');
const sjcl = require('sjcl');

const common = require('./common');

module.exports = {
  generateMnemonic() {
    return bip39.generateMnemonic();
  },

  encrypt(data, password) {
    return sjcl.encrypt(password, data);
  },
  decrypt(encryptedData, password) {
    return sjcl.decrypt(password, encryptedData);
  },

  async getEthereumKeypairByMnemonic(mnemonic, index) {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, `m/44'/60'/0'/0/${index}`);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  },
  async getCyberDKeypairByMnemonic(mnemonic, index) {
    return common.getCosmosKeypairByMnemonic(mnemonic, index, 'cyber', '118');
  },
  async getCosmosKeypairByMnemonic(mnemonic, index) {
    return common.getCosmosKeypairByMnemonic(mnemonic, index, 'cosmos', '118');
  },
  async getBinanceKeypairByMnemonic(mnemonic, index) {
    // https://github.com/binance-chain/javascript-sdk/blob/master/src/crypto/index.js
    return common.getCosmosKeypairByMnemonic(mnemonic, index, 'tbnb', '714');
  },
  async getIrisnetKeypairByMnemonic(mnemonic, index) {
    // https://github.com/irisnet/irisnet-crypto/blob/master/src/chains/cosmos/keypair.js
    return common.getIrisnetKeypairByMnemonic(mnemonic, index, null, '118');
  },
  async getTerraKeypairByMnemonic(mnemonic, index) {
    // https://github.com/terra-project/terra-js/blob/master/src/utils/keyUtils.ts
    return common.getCosmosKeypairByMnemonic(mnemonic, index, 'terra', '330');
  },

  async getEthereumKeypairByPrivateKey(privateKey) {
    const wallet = new ethers.Wallet(privateKey);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  },
  async getCyberKeypairByPrivateKey(privateKey) {
    return jsCosmosEncoding(cyberDConfig).importAccount(privateKey);
  },

  common,
};
