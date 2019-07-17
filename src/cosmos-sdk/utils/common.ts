export {};

const Sha256 = require('sha256');
const Secp256k1 = require('secp256k1');
const RIPEMD160 = require('ripemd160');
const _ = require('lodash');
const { bytesToHex, hexToBytes, isHex } = require('./hex');

const { toBech32 } = require('./bech32');

function marshalBinary(prefix, message) {
  let prefixBytes: any = _aminoPrefix(prefix);
  prefixBytes = Buffer.from(prefixBytes.concat(message.length));
  prefixBytes = Buffer.concat([prefixBytes, message]);
  return prefixBytes;
}

function _aminoPrefix(name) {
  let a = Sha256(name);
  let b = hexToBytes(a);
  while (b[0] === 0) {
    b = b.slice(1, b.length - 1);
  }
  b = b.slice(3, b.length - 1);
  while (b[0] === 0) {
    b = b.slice(1, b.length - 1);
  }
  b = b.slice(0, 4);
  return b;
}

function getAddress(publicKey) {
  if (publicKey.length > 33) {
    publicKey = publicKey.slice(5, publicKey.length);
  }
  const hmac = Sha256(publicKey);
  const b = Buffer.from(hexToBytes(hmac));
  const addr = new RIPEMD160().update(b);

  return addr.digest('hex').toUpperCase();
}

function importPrivateKey(secretKey) {
  const secretBytes = Buffer.from(secretKey, 'hex');
  const pubKey = Secp256k1.publicKeyCreate(secretBytes);

  return {
    address: getAddress(pubKey),
    privateKey: secretKey,
    publicKey: bytesToHex(pubKey),
  };
}

function sign(private_key, msg) {
  const sigByte = Buffer.from(JSON.stringify(msg));
  const sig32 = Buffer.from(
    Sha256(sigByte, {
      asBytes: true,
    })
  );
  const prikeyArr = Buffer.from(new Uint8Array(hexToBytes(private_key)));
  const sig = Secp256k1.sign(sig32, prikeyArr);

  return Array.from(sig.signature);
}

module.exports = {
  marshalBinary,
  hexToBytes,
  sign,
  importPrivateKey,
};
