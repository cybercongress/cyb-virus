import EthData from '@galtproject/frontend-core/libs/EthData';

const cyberjsBuilder = require('@litvintech/cyberjs/builder');
const cyberjsCodec = require('@litvintech/cyberjs/codec');
const cyberjsConstants = require('@litvintech/cyberjs/constants');
const axios = require('axios');

export default class Cosmos {
  rpc: string;

  constructor(rpc) {
    this.rpc = rpc;
  }

  async getBalance(address) {
    return axios({
      method: 'get',
      url: `${this.rpc}/bank/balances/${address}`,
    }).then(response => {
      return response.data ? response.data[0].amount : 0;
    });
  }

  async getMegaBalance(address) {
    return this.getBalance(address).then(cyb => {
      cyb = EthData.weiToDecimals(cyb, 6);

      const strSplit = cyb.toString().split('.');
      if (strSplit.length === 1) {
        return cyb;
      }
      return parseFloat(strSplit[0] + '.' + strSplit[1].slice(0, 3));
    });
  }

  async getGigaBalance(address) {
    return this.getBalance(address).then(cyb => {
      cyb = EthData.weiToDecimals(cyb, 9);

      const strSplit = cyb.toString().split('.');
      if (strSplit.length === 1) {
        return cyb;
      }
      return parseFloat(strSplit[0] + '.' + strSplit[1].slice(0, 3));
    });
  }

  async getStatus() {
    return axios({
      method: 'get',
      url: `${this.rpc}/status`,
    }).then(response => response.data.result);
  }

  async getNetworkId() {
    return this.getStatus().then(data => data.node_info.network);
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
}
