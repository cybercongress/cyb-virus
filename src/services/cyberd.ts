import EthData from '@galtproject/frontend-core/libs/EthData';

const cyberjsBuilder = require('@litvintech/cyberjs/builder');
const cyberjsCodec = require('@litvintech/cyberjs/codec');
const axios = require('axios');
const node = 'http://86.57.254.202:36657';

export class CyberD {
  static async getBalance(address) {
    return axios({
      method: 'get',
      url: `${node}/account?address="${address}"`,
    }).then(response => response.data.result.account.coins[0].amount);
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

  static async getStatus() {
    return axios({
      method: 'get',
      url: `${node}/status`,
    }).then(response => response.data.result);
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

    return axios({
      method: 'get',
      url: `${node}/submit_signed_link?data="${signedSendHex}"`,
    })
      .then(response => response.data)
      .catch(error => console.error('Cannot send', error));
  }
}
