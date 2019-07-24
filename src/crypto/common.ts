import Hd from './hd';

const bip39 = require('bip39');
const bech32 = require('bech32');
const bip32 = require('bip32');
const bitcoinjs = require('bitcoinjs-lib');
const Secp256k1 = require('secp256k1');
const Sha256 = require('sha256');
const RIPEMD160 = require('ripemd160');

const { marshalBinary } = require('js-cosmos/dist/utils/common');
const { hexToBytes } = require('js-cosmos/dist/utils/hex');

module.exports = {
  async getCosmosKeypairByMnemonic(mnemonic, index, prefix, chainIndex = '118') {
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const node = bip32.fromSeed(seed);
    const child = node.derivePath(`m/44'/${chainIndex}'/0'/0/${index}`);
    const words = bech32.toWords(child.identifier);
    const address = bech32.encode(prefix, words);
    const ecpair = bitcoinjs.ECPair.fromPrivateKey(child.privateKey, { compressed: false });
    const privateKey = ecpair.privateKey.toString('hex');
    return {
      address,
      privateKey,
    };
  },
  async getIrisnetKeypairByMnemonic(mnemonic, index, prefix, chainIndex = '118') {
    // https://github.com/irisnet/irisnet-crypto/blob/master/src/chains/cosmos/keypair.js
    const seed = await bip39.mnemonicToSeed(mnemonic);
    let master = Hd.ComputeMastersFromSeed(seed);
    let privateKey = Hd.DerivePrivateKeyForPath(master.secret, master.chainCode, `44'/${chainIndex}'/0'/0/${index}`);
    let pubKey = Secp256k1.publicKeyCreate(privateKey);
    pubKey = marshalBinary('tendermint/PubKeySecp256k1', pubKey);

    if (pubKey.length > 33) {
      pubKey = pubKey.slice(5, pubKey.length);
    }
    let hmac = Sha256(pubKey);
    let b = Buffer.from(hexToBytes(hmac));
    let addr = new RIPEMD160().update(b);
    const address = addr.digest('hex').toUpperCase();

    return {
      address,
      privateKey: privateKey.toString('hex'),
    };
  },
};
