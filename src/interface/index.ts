export interface AppAccount {
  address;
  privateKey?;
  coinType?;
  groupId?;
  position?;
  networkName?;
  encryptedPrivateKey?;
}

export interface AppAccountGroup {
  id;
  title;
  derivationIndex;
}
