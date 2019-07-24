export interface AppAccount {
  address;
  privateKey?;
  keyPairType?;
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
