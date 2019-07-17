export {};

let { TypeFactory, Types } = require('js-amino');

let CyberDMsgLink = TypeFactory.create('cyberd/Link', [
  {
    name: 'address',
    type: Types.ByteSlice,
  },
  {
    name: 'links',
    type: Types.Struct,
  },
]);

let CyberDMsgLinkData = TypeFactory.create('links', [
  {
    name: 'from',
    type: Types.ByteSlice,
  },
  {
    name: 'to',
    type: Types.ByteSlice,
  },
]);

let CyberDSignMsg = TypeFactory.create('SignMsg', [
  {
    name: 'chainID',
    type: Types.String,
  },
  {
    name: 'accnum',
    type: Types.String,
  },
  {
    name: 'sequence',
    type: Types.String,
  },
  {
    name: 'fee',
    type: Types.Struct,
  },
  {
    name: 'msg',
    type: Types.ArrayStruct,
  },
  {
    name: 'memo',
    type: Types.String,
  },
]);

let CyberDTxRequest = TypeFactory.create('TxRequest', [
  {
    name: 'msgs',
    type: Types.ArrayStruct,
  },
  {
    name: 'fee',
    type: Types.Struct,
  },
  {
    name: 'signature',
    type: Types.Struct,
  },
  {
    name: 'memo',
    type: Types.String,
  },
]);

module.exports = {
  CyberDMsgLink,
  CyberDMsgLinkData,
  CyberDSignMsg,
  CyberDTxRequest,
};
