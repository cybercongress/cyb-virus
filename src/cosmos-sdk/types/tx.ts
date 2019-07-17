export {};

let { TypeFactory, Types } = require('js-amino');

let MsgSend = TypeFactory.create('MsgSend', [
  {
    name: 'to',
    type: Types.ByteSlice,
  },
  {
    name: 'amount',
    type: Types.Struct,
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
