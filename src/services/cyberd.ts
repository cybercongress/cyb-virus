// const cosmosJs = require('@litvintech/cosmos-js');

const { Codec, FieldOptions, TypeFactory, Utils, Types, WireTypes } = require('@cybercongress/js-amino');

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

let Link = TypeFactory.create('link', [
  {
    name: 'from',
    type: Types.String,
  },
  {
    name: 'to',
    type: Types.String,
  },
]);

let MsgLink = TypeFactory.create('MsgLink', [
  {
    name: 'address',
    type: Types.String,
  },
  {
    name: 'links',
    type: Types.ArrayStruct,
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

let Signature = TypeFactory.create('signature', [
  {
    name: 'pub_key',
    type: Types.Interface,
  },
  {
    name: 'signature',
    type: Types.ByteSlice,
  },
]);

let codec = new Codec();

codec.registerConcrete(new StdTx(), 'auth/StdTx', {});
codec.registerConcrete(new MsgLink(), 'cyberd/Link', {});
codec.registerConcrete(new PubKeySecp256k1(), 'tendermint/PubKeySecp256k1', {});

let coin = new Coin('cyb', '10000');

let crypto = require('shr-keys');
const KeyPair = require('shr-keys').KeyPair;
// let Client = cosmosJs.Client;
// let client = new Client('http://86.57.254.202:36657');
// let clientSocket = new Client('ws://86.57.254.202:36657');

export class CyberD {
  static async getBalance(address) {
    console.log('getBalance', address);
    // return cosmosJs.getBalance(client, address);
  }
  /**
   * Link the hashes
   * @param from
   * @param firstHash
   * @param secondHash
   */
  static async link(from, firstHash, secondHash) {
    // let privateKey = "ab83994cf95abe45b9d8610524b3f8f8fd023d69f79449011cb5320d2ca180c5";

    let keyPair = crypto.KeyPair.fromPrivateKey(from.privateKey);

    // let address = [59,58,243,13,132,163,164,202,233,7,236,93,136,166,181,175,236,69,48,186];
    let link = new Link('QmV2i3zrWF2ZzmKtzMFMFqyrAjadShFn5qwmU3ANv66BUY', 'QmSQuSbrLrrUK4qUUsHPrk68WaBH6DFerkUhxf9zJZaSSS');
    let sendLinkMsg = new MsgLink(from.address, [link]);

    let fee = new Fee([new Coin('cyb', '0')], 200000);
    let pubKey = new PubKeySecp256k1([
      2,
      27,
      24,
      0,
      255,
      96,
      147,
      21,
      64,
      29,
      132,
      192,
      108,
      219,
      59,
      134,
      206,
      201,
      126,
      224,
      63,
      160,
      24,
      236,
      170,
      124,
      164,
      95,
      43,
      180,
      6,
      246,
      250,
    ]);
    let signature = [
      165,
      76,
      109,
      61,
      53,
      129,
      190,
      147,
      52,
      224,
      34,
      106,
      235,
      208,
      224,
      36,
      190,
      25,
      204,
      36,
      226,
      129,
      97,
      109,
      35,
      130,
      217,
      228,
      144,
      106,
      10,
      134,
      14,
      183,
      95,
      252,
      219,
      235,
      22,
      92,
      37,
      53,
      3,
      89,
      111,
      173,
      12,
      158,
      146,
      71,
      82,
      113,
      236,
      241,
      170,
      121,
      217,
      20,
      236,
      23,
      131,
      35,
      80,
      29,
    ];

    let sig = new Signature(pubKey, signature);
    let stdTx = new StdTx([sendLinkMsg], fee, [sig], 'elonmusk');

    let jsonTx = codec.marshalJson(stdTx);
    let decodedDataTx = new StdTx();

    console.log('Binary stdTx:\n ', codec.marshalBinary(stdTx).toString());

    console.log('Json:\n', jsonTx);

    codec.unMarshalBinary(codec.marshalBinary(stdTx), decodedDataTx);

    console.log('Decoded data:\n', decodedDataTx.JsObject());
  }
}
