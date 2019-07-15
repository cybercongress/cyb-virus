export {};

const axios = require('axios');
const cyberjsBuilder = require('@litvintech/cyberjs/builder');
const cyberjsCodec = require('@litvintech/cyberjs/codec');

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

  async transfer(txOptions, addressTo, gAmount) {
    const chainId = await this.getNetworkId();
    const account = await this.getAccountInfo(txOptions.address);

    const acc = {
      address: account.address,
      chain_id: chainId,
      account_number: parseInt(account.account_number, 10),
      sequence: parseInt(account.sequence, 10),
    };

    const amount = parseFloat(gAmount) * 10 ** 9;

    const sendRequest = {
      acc,
      amount,
      from: account.address,
      // to: cyberjsCodec.bech32.toBech32(cyberjsConstants.CyberdNetConfig.PREFIX_BECH32_ACCADDR, addressTo),
      to: addressTo,
      type: 'send',
    };

    const txRequest = cyberjsBuilder.buildAndSignTxRequest(sendRequest, txOptions.privateKey, chainId);
    const signedSendHex = cyberjsCodec.hex.stringToHex(JSON.stringify(txRequest));

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

    const txRequest = cyberjsBuilder.buildAndSignTxRequest(sendRequest, txOptions.privateKey, chainId);
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
