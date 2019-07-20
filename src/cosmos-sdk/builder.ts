export {};

const _ = require('lodash');

let { MsgSend, MsgMultiSend } = require('./types/tx');

let { MsgLink, SignMsg } = require('./types/cyberd');

let { Fee, StdTx, Signature, Coin, Input, Output, PubKeySecp256k1, SignatureSecp256k1, MsgForSign, AuthTx } = require('./types/base');

const CosmosCodec = require('./codec');

const { hexToBytes, arrToHex, hexToArr } = require('./utils/hex');

const { bech32ToAddress } = require('./utils/bech32');
const encoding = require('./utils/encoding');

const { sign, importPrivateKey } = require('./utils/common');

export default class CosmosBuilder {
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

  // return {
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
    let methodArgs = _.map(arguments, arg => arg).slice(1);
    return this[methodName].bind(this);
  }
  // buildLinkRequest() {},
  // }
}

function buildLinkSignMsg(acc, cidTo, cidFrom, chainId) {
  const fee = new Fee();
  const msg = new MsgLink(acc.address, cidTo, cidFrom);

  return new SignMsg(chainId, acc.account_number, acc.sequence, fee, msg, '');
}

function buildSendSignMsg(acc, from, to, amount, chainId) {
  const fee = new Fee();
  const msg = new MsgSend(from, to, amount);
  return new SignMsg(chainId, acc.account_number, acc.sequence, fee, msg, '');
}

function buildSignature(pub_key, signature, accountNumber, sequence) {
  return new Signature(pub_key, signature, accountNumber, sequence);
}
