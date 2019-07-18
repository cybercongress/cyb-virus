export {};

const axios = require('axios');
const cyberjsBuilder = require('@litvintech/cyberjs/builder');
const cyberjsCodec = require('@litvintech/cyberjs/codec');
const cosmosBuilder = require('../cosmos-sdk/builder');
const { stringToHex } = require('../cosmos-sdk/utils/hex');

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

    const requestData = {
      account: {
        address: account.address,
        privateKey: txOptions.privateKey,
        accountNumber: parseInt(account.account_number, 10),
        sequence: parseInt(account.sequence, 10),
      },
      chainId: chainId,
      amount,
      from: account.address,
      // to: cyberjsCodec.bech32.toBech32(cyberjsConstants.CyberdNetConfig.PREFIX_BECH32_ACCADDR, addressTo),
      to: addressTo,
      coin: 'cyb',
      memo: 'elonmusk',
    };

    const txRequest = cosmosBuilder.sendRequest(requestData);
    console.log('txRequest', txRequest);
    // const signedSendHex = stringToHex(txRequest);
    // console.log('signedSendHex', signedSendHex);

    // return axios.post(`${this.rpc}/txs`, txRequest.json)
    return axios({
      method: 'get',
      url: `${this.rpc}/broadcast_tx_commit?tx="${txRequest.hex}"`,
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

    const txRequest = cosmosBuilder.buildSendRequest(sendRequest, txOptions.privateKey, chainId);
    const signedSendHex = cyberjsCodec.hex.stringToHex(JSON.stringify(txRequest));

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
