const cosmosBuilder = require('../cosmos-sdk/builder');
const axios = require('axios');
const { importPrivateKey, weiToDecimals } = require('../cosmos-sdk/utils/common');

const encoding = require('../cosmos-sdk/utils/encoding');

export default class Cosmos {
  rpc: string;
  constants: any;

  constructor(rpc, constants) {
    this.rpc = rpc;
    this.constants = constants;
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
      cyb = weiToDecimals(cyb, 6);

      const strSplit = cyb.toString().split('.');
      if (strSplit.length === 1) {
        return cyb;
      }
      return parseFloat(strSplit[0] + '.' + strSplit[1].slice(0, 3));
    });
  }

  async getGigaBalance(address) {
    return this.getBalance(address).then(cyb => {
      cyb = weiToDecimals(cyb, 9);

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
      url: `${this.rpc}/auth/accounts/${address}`,
    });

    if (!addressInfo.data.value) {
      throw 'addressInfo.data.result undefined';
    }
    return addressInfo.data.value;
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
      from: account.address,
      to: addressTo,
      coin: 'cyb',
      memo: 'elonmusk',
    };

    const txRequest = cosmosBuilder.sendRequest(this.constants.CyberdNetConfig, requestData);
    console.log('txRequest', txRequest);

    return axios
      .post(`${this.rpc}/txs`, txRequest.json)
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
