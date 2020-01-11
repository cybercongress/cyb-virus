import { AppWallet, CoinType, StorageVars } from '../../../../../services/data';
import App from '../../../../../options/App';

const _ = require('lodash');

export default {
  template: require('./ImportAccount.html'),
  methods: {
    async importAccount() {
      if (this.importMethod === 'privateKey') {
        const account = await AppWallet.getAccountByPrivateKey(CoinType.Cosmos, this.privateKey);
        await AppWallet.addAccount(StorageVars.CyberDAccounts, account.address, account.privateKey);
        this.$store.commit(StorageVars.CurrentAccounts, this.$store.state[StorageVars.CyberDAccounts]);
        this.$router.push({ name: 'cabinet-cyberd' });
      } else if (this.importMethod === 'mnemonic') {
        const account = await AppWallet.getAccountByMnenomic(CoinType.Cosmos, this.mnemonic);
        await AppWallet.addAccount(StorageVars.CyberDAccounts, account.address, account.privateKey);
        this.$store.commit(StorageVars.CurrentAccounts, this.$store.state[StorageVars.CyberDAccounts]);
        this.$router.push({ name: 'cabinet-cyberd' });
      }
    },
  },
  computed: {
    accounts() {
      return this.$store.state[StorageVars.CurrentAccounts];
    },
    coinType() {
      return this.$store.state[StorageVars.CoinType];
    },
  },
  data() {
    return {
      methodList: [{ title: 'Private Key', value: 'privateKey' }, { title: 'Mnemonic', value: 'mnemonic' }],
      importMethod: ['privateKey', 'mnemonic'],
      privateKey: '',
      mnemonic: '',
    };
  },
};
