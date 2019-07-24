const BN = require('bn');
const Secp256k1 = require('secp256k1');

export default class Hd {
  static ComputeMastersFromSeed(seed) {
    let masterSecret = Buffer.from('Bitcoin seed');
    let master = Hd.I64(masterSecret, seed);
    return master;
  }

  static DerivePrivateKeyForPath(privKeyBytes, chainCode, path) {
    let data = privKeyBytes;
    let parts = path.split('/');
    parts.forEach(function(part) {
      let harden = part.slice(part.length - 1, part.length) === "'";
      if (harden) {
        part = part.slice(0, part.length - 1);
      }
      let idx = parseInt(part);
      let json = Hd.DerivePrivateKey(data, chainCode, idx, harden);
      data = json.data;
      chainCode = json.chainCode;
    });
    let derivedKey = data;
    return derivedKey;
  }

  static I64(key, data) {
    let createHmac = require('create-hmac');
    let hmac = createHmac('sha512', key);
    hmac.update(data); //optional encoding parameter
    let i = hmac.digest(); // synchronously get result with optional encoding parameter
    return {
      secret: i.slice(0, 32),
      chainCode: i.slice(32, i.length),
    };
  }

  static DerivePrivateKey(privKeyBytes, chainCode, index, harden) {
    let data;
    let indexBuffer = Buffer.from([index]);
    if (harden) {
      let c = new BN(index).or(new BN(0x80000000));
      indexBuffer = c.toBuffer();

      let privKeyBuffer = Buffer.from(privKeyBytes);
      data = Buffer.from([0]);
      data = Buffer.concat([data, privKeyBuffer]);
    } else {
      const pubKey = Secp256k1.publicKeyCreate(privKeyBytes);
      if (index == 0) {
        indexBuffer = Buffer.from([0, 0, 0, 0]);
      }
      data = pubKey;
    }
    data = Buffer.concat([data, indexBuffer]);
    let i64P = Hd.I64(chainCode, Uint8Array.from(data));
    let aInt = new BN(privKeyBytes);
    let bInt = new BN(i64P.secret);
    let x = Hd.AddScalars(aInt, bInt);

    return {
      data: x,
      chainCode: i64P.chainCode,
    };
  }

  static AddScalars(a, b) {
    let c = a.add(b);
    const bn = require('secp256k1/lib/js/bn');
    let n = bn.n.toBuffer();
    let x = c.mod(new BN(n)).toBuffer();
    let buf = Buffer.alloc(32);
    buf.fill(x, 32 - x.length);
    return buf;
  }
}
