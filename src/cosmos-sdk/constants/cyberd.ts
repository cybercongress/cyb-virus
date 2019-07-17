class TxType {
  static LINK;
  static SEND;
  // constructor() {
  //     this.LINK = 'link';
  //     this.SEND = 'send';
  // };
  // LINK: 'link';
  // SEND: 'send';
}

TxType.LINK = 'link';
TxType.SEND = 'send';

class CyberdNetConfig {
  static MAXGAS;
  static PREFIX_BECH32_ACCADDR;
  static PREFIX_BECH32_ACCPUB;
  static ENCODING_BECH32;
  static ENCODING_HEX;
  static DEFAULT_ENCODING;

  // constructor() {
  //     this.MAXGAS = 200000;
  //     this.PREFIX_BECH32_ACCADDR = 'cyber';
  //     this.PREFIX_BECH32_ACCPUB = 'cyberpub';
  //     this.ENCODING_BECH32 = 'bech32';
  //     this.ENCODING_HEX = 'hex';
  //     this.DEFAULT_ENCODING = CyberdNetConfig.ENCODING_BECH32;
  // };
}

CyberdNetConfig.MAXGAS = 200000;
CyberdNetConfig.PREFIX_BECH32_ACCADDR = 'cyber';
CyberdNetConfig.PREFIX_BECH32_ACCPUB = 'cyberpub';
CyberdNetConfig.ENCODING_BECH32 = 'bech32';
CyberdNetConfig.ENCODING_HEX = 'hex';
CyberdNetConfig.DEFAULT_ENCODING = CyberdNetConfig.ENCODING_BECH32;

class AminoKey {
  static BIP44Prefix;
  static FullFundraiserPath;

  // constructor() {
  //     this.BIP44Prefix = "44'/118'/";
  //     this.FullFundraiserPath = `${AminoKey.BIP44Prefix}0'/0/0`;
  // };
}

AminoKey.BIP44Prefix = "44'/118'/";
AminoKey.FullFundraiserPath = `${AminoKey.BIP44Prefix}0'/0/0`;

module.exports = {
  TxType,
  CyberdNetConfig,
  AminoKey,
};
