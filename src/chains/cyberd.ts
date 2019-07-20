export {};

const axios = require('axios');
const cyberjsBuilder = require('@litvintech/cyberjs/builder');
const CosmosBuilder = require('../cosmos-sdk/builder');
const CosmosCodec = require('../cosmos-sdk/codec');
const encoding = require('../cosmos-sdk/utils/encoding');
const { stringToHex, hexToBytes } = require('../cosmos-sdk/utils/hex');
const { sign, sortObject } = require('../cosmos-sdk/utils/common');
const { bech32ToAddress } = require('../cosmos-sdk/utils/bech32');
const { CyberDTxRequest, CyberDFee, CyberDSignature } = require('../cosmos-sdk/types/cyberd');
const { Coin, Input, Output, Fee } = require('../cosmos-sdk/types/base');
const { MsgMultiSend } = require('../cosmos-sdk/types/tx');

import Cosmos from './cosmos';

export default class CyberD extends Cosmos {
  async getBalance(address) {
    return axios({
      method: 'get',
      url: `${this.rpc}/account?address="${address}"`,
    }).then(response => (response.data.result ? response.data.result.account.coins[0].amount : 0));
  }

  async getBandwidth(address) {
    return axios({
      method: 'get',
      url: `${this.rpc}/account_bandwidth?address="${address}"`,
    }).then(response => (response.data.result ? { remained: response.data.result.remained, maxValue: response.data.result.max_value } : { error: 'unknown' }));
  }

  async search(keywordHash) {
    return axios({
      method: 'get',
      url: `${this.rpc}/search?cid=%22${keywordHash}%22&page=0&perPage=10`,
    }).then(response => (response.data.result ? response.data.result.cids : []));
  }

  async getAccountInfo(address) {
    const addressInfo = await axios({
      method: 'get',
      url: `${this.rpc}/account?address="${address}"`,
    });

    if (!addressInfo.data.result) {
      throw 'addressInfo.data.result undefined';
    }
    const account = addressInfo.data.result.account;
    if (!account) {
      throw 'addressInfo.data.result.account undefined';
    }
    return addressInfo.data.result.account;
  }

  async transfer(txOptions, addressTo, gAmount) {
    const chainId = await this.getNetworkId();
    const account = await this.getAccountInfo(txOptions.address);

    const amount = parseFloat(gAmount) * 10 ** 9;

    const keyPair = encoding(this.constants.NetConfig).importAccount(txOptions.privateKey);

    const requestData = {
      account: {
        address: keyPair.address,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        accountNumber: parseInt(account.account_number, 10),
        sequence: parseInt(account.sequence, 10),
      },
      chainId: chainId,
      amount,
      to: addressTo,
      coin: 'cyb',
      memo: '',
    };

    const cosmosBuilder = new CosmosBuilder();

    const cosmosCodec = new CosmosCodec();
    cosmosBuilder.setCodec(cosmosCodec);

    cosmosBuilder.setMethod('sendRequest', function(sendOptions) {
      let { account } = sendOptions;
      let coin = new Coin(sendOptions.coin, sendOptions.amount.toString());

      let msg = new MsgMultiSend([new Input(account.address, [coin])], [new Output(sendOptions.to, [coin])]);

      return this.abstractRequest(sendOptions, msg);
    });

    cosmosBuilder.setMethod('getResultTx', function(options) {
      let { msgs, fee, sigs, memo } = options;
      return new CyberDTxRequest(msgs, fee, sigs, memo);
    });

    cosmosBuilder.setMethod('getFee', function(options) {
      return new CyberDFee([new Coin('', '0')], 200000);
    });

    cosmosBuilder.setMethod('getSignature', function(options, signedBytes) {
      const { account } = options;
      return new CyberDSignature(Array.from(hexToBytes(bech32ToAddress(account.publicKey))), Array.from(signedBytes), account.accountNumber, account.sequence);
    });

    cosmosBuilder.setMethod('signMessageJson', function(options, messageJson) {
      let messageObj = JSON.parse(messageJson);
      messageObj.fee.gas = messageObj.fee.gas.toString();
      return sign(options.account.privateKey, JSON.stringify(messageObj));
    });

    const txRequest = cosmosBuilder.sendRequest(requestData);
    const jsObject = JSON.parse(txRequest.json);
    jsObject.signatures.forEach(sign => {
      sign.pub_key = Array.from(Buffer.from(sign.pub_key, 'base64'));
      sign.signature = Array.from(Buffer.from(sign.signature, 'base64'));
    });
    txRequest.json = JSON.stringify(jsObject);

    const signedSendHex = stringToHex(txRequest.json);

    return axios({
      method: 'get',
      url: `${this.rpc}/submit_signed_send?data="${signedSendHex}"`,
    })
      .then(res => {
        if (!res.data) {
          throw new Error('Empty data');
        }
        if (res.data.error) {
          throw res.data.error;
        }
        return res.data;
      })
      .catch(error => {
        console.error('Transfer error', error);
        throw error;
      });
  }

  async link(txOptions, keywordHash, contentHash) {
    const chainId = await this.getNetworkId();
    const account = await this.getAccountInfo(txOptions.address);

    const acc = {
      address: account.address,
      chain_id: chainId,
      account_number: parseInt(account.account_number, 10),
      sequence: parseInt(account.sequence, 10),
    };

    const sendRequest = {
      acc,
      fromCid: keywordHash,
      toCid: contentHash,
      type: 'link',
    };

    const cosmosBuilder = new CosmosBuilder();

    cosmosBuilder.setCodec();

    const txRequest = cosmosBuilder.buildSendRequest(sendRequest, txOptions.privateKey, chainId);
    const signedSendHex = stringToHex(JSON.stringify(txRequest));

    // let websocket = new WebSocket('ws://earth.cybernode.ai:34657/websocket');
    // websocket.onmessage = function(msg) {
    //   console.log('onmessage', msg);
    // };
    // websocket.send(
    //   JSON.stringify({
    //     method: 'subscribe',
    //     params: ["tm.event='NewBlockHeader'"],
    //     id: '1',
    //     jsonrpc: '2.0',
    //   })
    // );

    return axios({
      method: 'get',
      url: `${this.rpc}/submit_signed_link?data="${signedSendHex}"`,
    })
      .then(res => {
        if (!res.data) {
          throw new Error('Empty data');
        }
        if (res.data.error) {
          throw res.data.error;
        }
        return res.data;
      })
      .catch(error => {
        console.error('Link error', error);
        throw error;
      });
  }
}
