export {};

const _ = require('lodash');

let { MsgSend } = require('../types/tx');

let { Fee, StdTx, Signature, Coin, PubKeySecp256k1, MsgForSign } = require('../types/base');

const CosmosCodec = require('../codec');

const { hexToBytes, arrToHex } = require('../utils/hex');

const { bech32ToAddress } = require('../utils/bech32');

const { sign } = require('../utils/common');

export default class CosmosSdkBuilder {
  codec;

  constructor() {
    this.codec = new CosmosCodec();
    this.codec.applyTendermint();
    this.codec.applyCosmos();
  }

  setCodec(codec) {
    this.codec = codec;
  }

  getFee(options) {
    return new Fee([new Coin(options.fee.denom, options.fee.amount)], '200000');
  }

  getMessageForSign(options, data) {
    let { account, memo } = options;
    let { msgs, fee } = data;
    return new MsgForSign(options.chainId.toString(), account.accountNumber.toString(), account.sequence.toString(), fee, msgs, memo);
  }

  getSignature(options, signedBytes) {
    return new Signature(new PubKeySecp256k1(hexToBytes(bech32ToAddress(options.account.publicKey))), signedBytes);
  }

  getResultTx(options, data) {
    let { memo } = options;
    let { msgs, fee, sigs } = data;
    return new StdTx(msgs, fee, sigs, memo);
  }

  signMessageJson(options, messageJson) {
    return sign(options.account.privateKey, messageJson);
  }

  abstractRequest(options, msg) {
    if (_.isUndefined(options.memo) || _.isNull(options.memo)) {
      options.memo = '';
    }
    let fee = this.getFee(options);

    const msgForSign = this.getMessageForSign(options, { msgs: [msg], fee });
    const signedBytes = this.signMessageJson(options, this.codec.marshalJson(msgForSign));
    const sig = this.getSignature(options, signedBytes);

    let stdTx = this.getResultTx(options, { msgs: [msg], sigs: [sig], fee });
    const json = this.codec.marshalJson(stdTx);

    let hex = arrToHex(this.codec.marshalBinary(stdTx));

    if (!_.isString(hex)) {
      hex = hex.toString('base64');
    }
    return {
      json,
      hex,
    };
  }

  sendRequest(sendOptions) {
    let { account } = sendOptions;
    let coin = new Coin(sendOptions.denom, sendOptions.amount.toString());

    //hexToBytes(bech32ToAddress())
    console.log('MsgSend', account.address, sendOptions.to, [coin]);
    const msg = new MsgSend(account.address, sendOptions.to, [coin]);
    return this.abstractRequest(sendOptions, msg);
  }

  setMethod(methodName, func) {
    this[methodName] = func;
  }

  callMethod(methodName) {
    return this[methodName].bind(this);
  }
}
