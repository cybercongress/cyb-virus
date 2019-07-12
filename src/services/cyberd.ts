import EthData from '@galtproject/frontend-core/libs/EthData';

const cyberjsBuilder = require('@litvintech/cyberjs/builder');
const cyberjsCodec = require('@litvintech/cyberjs/codec');
const cyberjsConstants = require('@litvintech/cyberjs/constants');
const axios = require('axios');
const node = 'http://88.198.36.117:26657';
const indexedNode = 'http://88.198.36.117:26657';

export class CyberD {
  static async getBalance(address) {
    return axios({
      method: 'get',
      url: `${node}/account?address="${address}"`,
    }).then(response => (response.data.result ? response.data.result.account.coins[0].amount : 0));
  }

  static async getGigaBalance(address) {
    return this.getBalance(address).then(cyb => {
      cyb = EthData.weiToDecimals(cyb, 9);

      const strSplit = cyb.toString().split('.');
      if (strSplit.length === 1) {
        return cyb;
      }
      return parseFloat(strSplit[0] + '.' + strSplit[1].slice(0, 2));
    });
  }

  static async getBandwidth(address) {
    return axios({
      method: 'get',
      url: `${node}/account_bandwidth?address="${address}"`,
    }).then(response => (response.data.result ? { remained: response.data.result.remained, maxValue: response.data.result.max_value } : { error: 'unknown' }));
  }

  static async getStatus() {
    return axios({
      method: 'get',
      url: `${node}/status`,
    }).then(response => response.data.result);
  }

  static async search(keywordHash) {
    return axios({
      method: 'get',
      url: `${indexedNode}/search?cid=%22${keywordHash}%22&page=0&perPage=10`,
    }).then(response => (response.data.result ? response.data.result.cids : []));
  }

  static async getNetworkId() {
    return this.getStatus().then(data => data.node_info.network);
  }

  static async link(txOptions, keywordHash, contentHash) {
    const chainId = await this.getNetworkId();
    const addressInfo = await axios({
      method: 'get',
      url: `${node}/account?address="${txOptions.address}"`,
    });

    if (!addressInfo.data.result) {
      return console.error('error: addressInfo.data.result undefined');
    }
    const account = addressInfo.data.result.account;
    if (!account) {
      return console.error('error: addressInfo.data.result.account undefined');
    }

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
      url: `${node}/submit_signed_link?data="${signedSendHex}"`,
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

  static async transfer(txOptions, addressTo, gAmount) {
    const chainId = await this.getNetworkId();
    const addressInfo = await axios({
      method: 'get',
      url: `${node}/account?address="${txOptions.address}"`,
    });

    if (!addressInfo.data.result) {
      return console.error('error: addressInfo.data.result undefined');
    }
    const account = addressInfo.data.result.account;
    if (!account) {
      return console.error('error: addressInfo.data.result.account undefined');
    }

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
      url: `${node}/submit_signed_send?data="${signedSendHex}"`,
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
}
