import { AppWallet, CoinType, StorageVars } from '../../../../../services/data';

export default {
  template: require('./ImportAccount.html'),
  methods: {
    async importAccount() {
      if (this.importMethod === 'privateKey') {
        const account = await AppWallet.getAccountByPrivateKey(CoinType.CyberD, this.privateKey);
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
      methodList: [{ title: 'Private Key', value: 'privateKey' }],
      importMethod: 'privateKey',
      privateKey: '',
    };
  },
};
