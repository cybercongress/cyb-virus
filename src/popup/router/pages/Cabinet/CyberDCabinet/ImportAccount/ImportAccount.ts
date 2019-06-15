import { AppWallet, CoinType, StorageVars } from '../../../../../../services/data';

const _ = require('lodash');

export default {
  template: require('./ImportAccount.html'),
  methods: {
    async importAccount() {
      if (this.importMethod === 'privateKey') {
        const account = await AppWallet.getAccountByPrivateKey(CoinType.Cosmos, this.privateKey);
        await AppWallet.addAccount(StorageVars.CyberDAccounts, account.address, account.privateKey);
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
