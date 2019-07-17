import { KeyPairType, NetworkType } from './enum';

module.exports = {
  baseKeyPairs: [KeyPairType.Cyber, KeyPairType.Cosmos], //, KeyPairType.Ether, KeyPairType.Irisnet, KeyPairType.Terra, KeyPairType.Binance
  defaultNetworksByKeyPairType: {
    [KeyPairType.Cyber]: NetworkType.CyberD,
    [KeyPairType.Cosmos]: NetworkType.Cosmos,
    [KeyPairType.Ether]: NetworkType.Ethereum,
    [KeyPairType.Irisnet]: NetworkType.Irisnet,
    [KeyPairType.Terra]: NetworkType.Terra,
    [KeyPairType.Binance]: NetworkType.BinanceChain,
  },
  defaultEndpointByNetworkName: {
    [NetworkType.CyberD]: {
      title: 'Euler',
      rpc: 'http://93.125.26.210:34657',
    },
    [NetworkType.Cosmos]: {
      title: 'Mainnet',
      // rpc: 'http://34.65.6.52:26657'
      rpc: 'https://stargate.cosmos.network',
    },
    [NetworkType.Ethereum]: {
      title: 'Mainnet',
      rpc: 'https://mainnet.infura.io/v3/f2d134e9767442c88963a0244d171faf',
    },
    [NetworkType.Irisnet]: {
      title: 'Mainnet',
      rpc: '',
    },
    [NetworkType.Terra]: {
      title: 'Columbus-2',
      lcd: 'https://lcd.terra.dev',
      fcd: 'https://fcd.terra.dev',
      rpc: 'https://rpc.terra.dev',
      wss: 'ws://rpc.terra.dev/websocket',
    },
    [NetworkType.BinanceChain]: {
      title: 'Mainnet',
      rpc: '',
    },
  },
  baseNetworks: [NetworkType.CyberD, NetworkType.Ethereum, NetworkType.Irisnet, NetworkType.Terra, NetworkType.BinanceChain],
  baseAccountsGroupTitle: 'Main account',
};
