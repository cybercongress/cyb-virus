export {};

const axios = require('axios');
const CosmosCodec = require('../cosmos-sdk/codec');
const encoding = require('../cosmos-sdk/utils/encoding');
const { stringToHex, hexToBytes } = require('../cosmos-sdk/utils/hex');
const { sign } = require('../cosmos-sdk/utils/common');
const { bech32ToAddress } = require('../cosmos-sdk/utils/bech32');
const { CyberDTxRequest, CyberDFee, CyberDSignature, CyberDMsgLink, CyberDMsgLinkData } = require('../cosmos-sdk/types/cyberd');
const { Coin, Input, Output, Fee } = require('../cosmos-sdk/types/base');
const { MsgMultiSend } = require('../cosmos-sdk/types/tx');

import Cosmos from './cosmos';

export default class CyberD extends Cosmos {
  constructor(rpc, constants) {
    super(rpc, constants);

    const cosmosCodec = new CosmosCodec();

    cosmosCodec.registerConcrete(new CyberDMsgLink(), 'cyberd/Link', {});

    this.cosmosBuilder.setCodec(cosmosCodec);

    this.cosmosBuilder.setMethod('sendRequest', function(sendOptions) {
      let { account } = sendOptions;
      let coin = new Coin(sendOptions.denom, sendOptions.amount.toString());

      let msg = new MsgMultiSend([new Input(account.address, [coin])], [new Output(sendOptions.to, [coin])]);

      return this.abstractRequest(sendOptions, msg);
    });

    this.cosmosBuilder.setMethod('linkRequest', function(sendOptions) {
      let linkData = new CyberDMsgLinkData(sendOptions.fromCid, sendOptions.toCid);
      let msg = new CyberDMsgLink(sendOptions.account.address, [linkData]);
      return this.abstractRequest(sendOptions, msg);
    });

    this.cosmosBuilder.setMethod('getResultTx', function(options) {
      let { msgs, fee, sigs, memo } = options;
      return new CyberDTxRequest(msgs, fee, sigs, memo);
    });

    this.cosmosBuilder.setMethod('getFee', function(options) {
      return new CyberDFee([new Coin(options.fee.denom, options.fee.amount)], 200000);
    });

    this.cosmosBuilder.setMethod('getSignature', function(options, signedBytes) {
      const { account } = options;
      return new CyberDSignature(Array.from(hexToBytes(bech32ToAddress(account.publicKey))), Array.from(signedBytes), account.accountNumber, account.sequence);
    });

    this.cosmosBuilder.setMethod('signMessageJson', function(options, messageJson) {
      let messageObj = JSON.parse(messageJson);
      messageObj.fee.gas = messageObj.fee.gas.toString();
      return sign(options.account.privateKey, JSON.stringify(messageObj));
    });
  }
  async getNodeInfo() {
    return axios({
      method: 'get',
      url: `${this.rpc}/status`,
    }).then(response => response.data.result);
  }

  async getNetworkId() {
    return this.getNodeInfo().then(data => data.node_info.network);
  }

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

  prepareRequestData(txRequest) {
    const jsObject = JSON.parse(txRequest.json);
    jsObject.signatures.forEach(sign => {
      sign.pub_key = Array.from(Buffer.from(sign.pub_key, 'base64'));
      sign.signature = Array.from(Buffer.from(sign.signature, 'base64'));
    });
    txRequest.json = JSON.stringify(jsObject);

    return stringToHex(txRequest.json);
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
      chainId,
      amount,
      to: addressTo,
      denom: 'cyb',
      fee: {
        denom: '',
        amount: '0',
      },
      memo: '',
    };

    const txRequest = this.cosmosBuilder.callMethod('sendRequest')(requestData);

    return axios({
      method: 'get',
      url: `${this.rpc}/submit_signed_send?data="${this.prepareRequestData(txRequest)}"`,
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

    const keyPair = encoding(this.constants.NetConfig).importAccount(txOptions.privateKey);

    const requestData = {
      account: {
        address: keyPair.address,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        accountNumber: parseInt(account.account_number, 10),
        sequence: parseInt(account.sequence, 10),
      },
      fee: {
        denom: '',
        amount: '0',
      },
      chainId,
      fromCid: keywordHash,
      toCid: contentHash,
      memo: '',
    };

    // requestData['acc'] = requestData.account;
    // requestData['acc']['account_number'] = requestData.account.accountNumber;
    // requestData['from'] = requestData.account.address;
    // requestData['type'] = 'link';

    // const cyberTxRequest = cyberjsBuilder.buildAndSignTxRequest(requestData, txOptions.privateKey, chainId);
    // console.log('cyber request', JSON.stringify(cyberTxRequest));
    // const signedSendHex = stringToHex(JSON.stringify(cyberTxRequest));

    const txRequest = this.cosmosBuilder.callMethod('linkRequest')(requestData);

    return axios({
      method: 'get',
      url: `${this.rpc}/submit_signed_link?data="${this.prepareRequestData(txRequest)}"`,
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
