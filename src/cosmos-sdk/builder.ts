export {};

const _ = require('lodash');

let { MsgSend, MsgMultiSend } = require('./types/tx');

let { MsgLink, SignMsg } = require('./types/cyberd');

let { Fee, StdTx, Signature, Coin, Input, Output, PubKeySecp256k1 } = require('./types/base');

const codec = require('./codec');

const { hexToBytes, arrToHex, hexToArr } = require('./utils/hex');

const { fromBech32 } = require('./utils/bech32');

const { sign, importPrivateKey } = require('./utils/common');

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
  sendRequest(sendOptions) {
    const { account } = sendOptions;

    let coin = new Coin(sendOptions.coin, sendOptions.amount.toString());
    console.log('Input', sendOptions.from, [coin]);
    let input = new Input(sendOptions.from, [coin]);
    console.log('Output', sendOptions.to, [coin]);
    let output = new Output(sendOptions.to, [coin]);
    console.log('MsgMultiSend', [input], [output]);
    let sendMultiMsg = new MsgMultiSend([input], [output]);
    console.log('Fee', [new Coin(sendOptions.coin, '0')], '200000');
    let fee = new Fee([new Coin(sendOptions.coin, '0')], '200000');

    console.log('marshalBinary', sendMultiMsg);
    const msgToSign = codec.marshalBinary(sendMultiMsg);

    console.log('sign', account.privateKey, msgToSign);
    const signedBytes = sign(account.privateKey, msgToSign);
    console.log('importPrivateKey', account.privateKey);
    const keyPair = importPrivateKey(account.privateKey);
    console.log('Signature', hexToBytes(keyPair.publicKey), signedBytes);
    const sig = new Signature(new PubKeySecp256k1(hexToBytes(keyPair.publicKey)), signedBytes);

    console.log('StdTx', [sendMultiMsg], fee, [sig], 'elonmusk');
    let stdTx = new StdTx([sendMultiMsg], fee, [sig], 'elonmusk');
    console.log('stdTx', stdTx);
    console.log('marshalJson', codec.marshalJson(stdTx));

    let result = arrToHex(codec.marshalBinary(stdTx));
    console.log('marshalBinary bytes', codec.marshalBinary(stdTx));
    console.log('marshalBinary hex', arrToHex(codec.marshalBinary(stdTx)));
    console.log('unmarshalBinary bytes', hexToArr(result));

    let decodedDataTx = new StdTx();
    codec.unMarshalBinary(hexToArr(result), decodedDataTx);

    console.log('unmarshalBinary json', decodedDataTx.JsObject());
    if (!_.isString(result)) {
      result = result.toString('base64');
    }
    return result;
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
