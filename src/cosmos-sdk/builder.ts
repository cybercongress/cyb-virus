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

module.exports = class CosmosBuilder {
  codec;

  constructor() {
    this.codec = new CosmosCodec();
    this.codec.applyTendermint();
    this.codec.applyCosmos();
  }

  setCodec(codec) {
    this.codec = codec;
  }
  // const encoding = require('./utils/encoding')(constants);
  //
  // function signTxRequest(signMsg, privateKey) {
  //   const objectToSign = signMsg.getSignObject();
  //   console.log("OBJECTS_TO_SIGN\n", objectToSign);
  //   const signedBytes = sign(privateKey, objectToSign);
  //   const keypair = encoding.importAccount(privateKey);
  //
  //   const signature = buildSignature(hexToBytes(keypair.publicKey), signedBytes, signMsg.accnum, signMsg.sequence);
  //   return buildTxRequest(signMsg.msgs, signMsg.fee, signature, signMsg.memo);
  // }

  // function buildAndSignTxRequest(req, privateKey, chainId) {
  //   const signMsg = buildSignMsg(req, chainId);
  //
  //   return signTxRequest(signMsg, privateKey);
  // }
  //
  // function buildSignMsg(req, chainId) {
  //   if (isHex(req.acc.address)) {
  //     req.acc.address = toBech32(constants.CyberdNetConfig.PREFIX_BECH32_ACCADDR, req.acc.address);
  //   }
  //
  //   let msg;
  //   switch (req.type) {
  //     case constants.TxType.LINK: {
  //       msg = buildLinkSignMsg(req.acc, req.fromCid, req.toCid, chainId);
  //       break;
  //     }
  //     case constants.TxType.SEND: {
  //       msg = buildSendSignMsg(req.acc, req.from, req.to, req.amount.toString(), chainId);
  //       break;
  //     }
  //     default: {
  //       throw 'not exist tx type';
  //     }
  //   }
  //
  //   return msg;
  // }

  getFee(options) {
    return new Fee([new Coin(options.fee.denom, options.fee.amount)], '200000');
  }

  getSignature(options, signedBytes) {
    return new Signature(new PubKeySecp256k1(hexToBytes(bech32ToAddress(options.account.publicKey))), signedBytes);
  }

  getResultTx(options) {
    let { msgs, fee, sigs, memo } = options;
    return new StdTx(msgs, fee, sigs, memo);
  }

  signMessageJson(options, messageJson) {
    return sign(options.account.privateKey, messageJson);
  }

  abstractRequest(options, msg) {
    let { account, memo } = options;

    if (_.isUndefined(memo) || _.isNull(memo)) {
      memo = '';
    }

    let fee = this.getFee(options);

    // MULTI SEND:
    // console.log('Input', sendOptions.from, [coin]);
    // let input = new Input(sendOptions.from, [coin]);
    // console.log('Output', sendOptions.to, [coin]);
    // let output = new Output(sendOptions.to, [coin]);
    // console.log('MsgMultiSend', [input], [output]);
    // let msg = new MsgMultiSend([input], [output]);

    // SINGLE SEND:
    // hexToBytes(bech32ToAddress(sendOptions.to))

    const msgForSign = new MsgForSign(options.chainId.toString(), account.accountNumber.toString(), account.sequence.toString(), fee, [msg], memo);
    console.log('sign', this.codec.marshalJson(msgForSign));
    const signedBytes = this.signMessageJson(options, this.codec.marshalJson(msgForSign));
    // console.log('Signature', hexToBytes(bech32ToAddress(account.publicKey)), signedBytes);
    const sig = this.getSignature(options, signedBytes);

    // console.log('StdTx', [msg], fee, [sig], memo);
    let stdTx = this.getResultTx({ msgs: [msg], sigs: [sig], fee, memo });
    console.log('stdTx', stdTx);
    const json = this.codec.marshalJson(stdTx);
    console.log('marshalJson', this.codec.marshalJson(stdTx));

    let hex = arrToHex(this.codec.marshalBinary(stdTx));
    console.log('marshalBinary bytes', JSON.stringify(this.codec.marshalBinary(stdTx)));
    console.log('marshalBinary hex', arrToHex(this.codec.marshalBinary(stdTx)));
    console.log('unmarshalBinary bytes', JSON.stringify(hexToArr(hex)));

    // let decodedDataTx = new StdTx();
    // codec.unMarshalBinary(hexToArr(hex), decodedDataTx);

    // console.log('unmarshalBinary json', decodedDataTx.JsObject());
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
  // buildLinkRequest() {},
  // }
};

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
