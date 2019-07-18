export {};

let { TypeFactory, Types } = require('js-amino');

let StdTx = TypeFactory.create('StdTx', [
  {
    name: 'msg',
    type: Types.ArrayInterface,
  },
  {
    name: 'fee',
    type: Types.Struct,
  },
  {
    name: 'signatures',
    type: Types.ArrayStruct,
  },
  {
    name: 'memo',
    type: Types.String,
  },
]);

let Coin = TypeFactory.create('coin', [
  {
    name: 'denom',
    type: Types.String,
  },
  {
    name: 'amount',
    type: Types.String,
  },
]);

let Input = TypeFactory.create('input', [
  {
    name: 'address',
    type: Types.String,
  },
  {
    name: 'coins',
    type: Types.ArrayStruct,
  },
]);

let Output = TypeFactory.create('output', [
  {
    name: 'address',
    type: Types.String,
  },
  {
    name: 'coins',
    type: Types.ArrayStruct,
  },
]);

let Fee = TypeFactory.create('fee', [
  {
    name: 'amount',
    type: Types.ArrayStruct,
  },
  {
    name: 'gas',
    type: Types.Int64,
  },
]);

let PubKeySecp256k1 = TypeFactory.create(
  'PubKeySecp256k1',
  [
    {
      name: 's',
      type: Types.ByteSlice,
    },
  ],
  Types.ByteSlice
);

let SignatureSecp256k1 = TypeFactory.create(
  'SignatureSecp256k1',
  [
    {
      name: 'bytes',
      type: Types.ByteSlice,
    },
  ],
  Types.ByteSlice
);

let Signature = TypeFactory.create('Signature', [
  {
    name: 'pubKey',
    type: Types.Interface,
  },
  {
    name: 'signature',
    type: Types.Struct,
  },
  {
    name: 'nonce',
    type: Types.Int64,
  },
]);

let AuthTx = TypeFactory.create('AuthTx', [
  {
    name: 'msg',
    type: Types.Interface,
  },
  {
    name: 'signature',
    type: Types.Struct,
  },
]);

let MsgForSign = TypeFactory.create('MsgForSign', [
  {
    name: 'chain_id',
    type: Types.String,
  },
  {
    name: 'account_number',
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
    name: 'msgs',
    type: Types.ArrayInterface,
  },
  {
    name: 'memo',
    type: Types.String,
  },
]);

module.exports = {
  Coin,
  Input,
  Output,
  Fee,
  Signature,
  StdTx,
  PubKeySecp256k1,
  SignatureSecp256k1,
  MsgForSign,
  AuthTx,
};
