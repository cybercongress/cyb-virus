import { KeyPairType, Network } from './enum';

module.exports = {
  baseKeyPairs: [KeyPairType.Cyber, KeyPairType.Ether, KeyPairType.Irisnet, KeyPairType.Terra, KeyPairType.Binance],
  defaultNetworksByKeyPairType: {
    [KeyPairType.Cyber]: Network.CyberD,
    [KeyPairType.Ether]: Network.EthereumMainnet,
    [KeyPairType.Irisnet]: Network.Irisnet,
    [KeyPairType.Terra]: Network.Terra,
    [KeyPairType.Binance]: Network.BinanceChain,
  },
  baseNetworks: [Network.CyberD, Network.EthereumMainnet, Network.Irisnet, Network.Terra, Network.BinanceChain],
  baseAccountsGroupTitle: 'Main account',
};
