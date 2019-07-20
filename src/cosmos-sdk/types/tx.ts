export {};

let { TypeFactory, Types } = require('js-amino');

let MsgSend = TypeFactory.create('MsgSend', [
  {
    name: 'from_address',
    type: Types.String,
  },
  {
    name: 'to_address',
    type: Types.String,
  },
  {
    name: 'amount',
    type: Types.ArrayStruct,
  },
]);

let MsgMultiSend = TypeFactory.create('cosmos-sdk/MsgMultiSend', [
  {
    name: 'inputs',
    type: Types.ArrayStruct,
  },
  {
    name: 'outputs',
    type: Types.ArrayStruct,
  },
]);

module.exports = {
  MsgMultiSend,
  MsgSend,
};
