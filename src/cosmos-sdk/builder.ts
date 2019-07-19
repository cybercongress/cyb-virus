export {};

const _ = require('lodash');

let { MsgSend, MsgMultiSend } = require('./types/tx');

let { MsgLink, SignMsg } = require('./types/cyberd');

let { Fee, StdTx, Signature, Coin, Input, Output, PubKeySecp256k1, SignatureSecp256k1, MsgForSign, AuthTx } = require('./types/base');

const codec = require('./codec');

const { hexToBytes, arrToHex, hexToArr } = require('./utils/hex');

const { fromBech32 } = require('./utils/bech32');
const encoding = require('./utils/encoding');

const { sign, importPrivateKey } = require('./utils/common');

let { addressToBech32, bech32ToAddress } = require('shr-keys');

module.exports = {
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

  // return {
  sendRequest(constants, sendOptions) {
    let { account, memo } = sendOptions;

    if (_.isUndefined(memo) || _.isNull(memo)) {
      memo = '';
    }

    let coin = new Coin(sendOptions.coin, sendOptions.amount.toString());
    console.log('Fee', [new Coin(sendOptions.coin, '0')], '200000');
    let fee = new Fee([new Coin(sendOptions.coin, '0')], '200000');

    // MULTI SEND:
    // console.log('Input', sendOptions.from, [coin]);
    // let input = new Input(sendOptions.from, [coin]);
    // console.log('Output', sendOptions.to, [coin]);
    // let output = new Output(sendOptions.to, [coin]);
    // console.log('MsgMultiSend', [input], [output]);
    // let sendMsg = new MsgMultiSend([input], [output]);

    // SINGLE SEND:
    // hexToBytes(bech32ToAddress(sendOptions.to))
    const sendMsg = new MsgSend(hexToBytes(bech32ToAddress(account.address)), hexToBytes(bech32ToAddress(sendOptions.to)), [coin]);

    console.log('MsgForSign', sendOptions.chainId, account.accountNumber, account.sequence, fee, [sendMsg]);

    const msgForSign = new MsgForSign(sendOptions.chainId, account.accountNumber, account.sequence, fee, [sendMsg], memo);
    console.log('sign', account.privateKey, codec.marshalJson(msgForSign));
    const signedBytes = sign(account.privateKey, codec.marshalJson(msgForSign));
    console.log('Signature', hexToBytes(account.publicKey), signedBytes);
    const sig = new Signature(new PubKeySecp256k1(hexToBytes(account.publicKey)), signedBytes);

    console.log('StdTx', [sendMsg], fee, [sig], memo);
    let stdTx = new StdTx([sendMsg], fee, [sig], memo);
    console.log('stdTx', stdTx);
    const json = codec.marshalJson(stdTx);
    console.log('marshalJson', codec.marshalJson(stdTx));

    let hex = arrToHex(codec.marshalBinary(stdTx));
    console.log('marshalBinary bytes', JSON.stringify(codec.marshalBinary(stdTx)));
    console.log('marshalBinary hex', arrToHex(codec.marshalBinary(stdTx)));
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
  },
  buildLinkRequest() {},
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
