export {};

const { importPrivateKey } = require('./common');
const { isHex } = require('./hex');
const { toBech32 } = require('./bech32');
const _ = require('lodash');

module.exports = function(constants) {
  function importAccount(privateKey) {
    const keyPair = importPrivateKey(privateKey);

    if (!keyPair) return null;

    return encodeAccount({
      address: keyPair.address,
      phrase: null,
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
    });
  }

  function encodeAccount(acc) {
    if (_.isEmpty(acc)) {
      return null;
    }
    const defaultCoding = constants.DEFAULT_ENCODING;

    switch (defaultCoding) {
      case constants.ENCODING_BECH32: {
        if (isHex(acc.address)) {
          acc.address = toBech32(constants.PREFIX_BECH32_ACCADDR, acc.address);
        }

        if (isHex(acc.publicKey)) {
          acc.publicKey = toBech32(constants.PREFIX_BECH32_ACCPUB, acc.publicKey);
        }
        break;
      }
      default: {
      }
    }
    return acc;
  }

  return {
    importAccount,
    encodeAccount,
  };
};
