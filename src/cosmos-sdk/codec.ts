const { Codec } = require('js-amino');

const { StdTx, PubKeySecp256k1, SignatureSecp256k1, Signature } = require('./types/base');

const { MsgMultiSend, MsgSend } = require('./types/tx');

let codec = new Codec();

// codec.registerConcrete(new StdTx(), 'auth/StdTx', {});
codec.registerConcrete(new MsgSend(), 'cosmos-sdk/MsgSend', {});
codec.registerConcrete(new MsgMultiSend(), 'cosmos-sdk/MsgMultiSend', {});
codec.registerConcrete(new PubKeySecp256k1(), 'tendermint/PubKeySecp256k1', {});

// codec.registerConcrete(new SignatureSecp256k1(), "tendermint/SigSecp256k1", {});
// codec.registerConcrete(new BasicSignature(), "tendermint/BasicSig", {})
// codec.registerConcrete(new Signature(), "tendermint/AuthSig", {})

module.exports = codec;
