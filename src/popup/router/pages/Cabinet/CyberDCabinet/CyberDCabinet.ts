import { AppCrypto, AppWallet, CoinType, PermanentStorage, StorageVars } from '../../../../../services/data';
import { CyberD } from '../../../../../services/cyberd';

export default {
  template: require('./CyberDCabinet.html'),
  async created() {
    if (!this.accounts.length) {
      const index = 0;
      const newAccount = await AppWallet.generateAccount(CoinType.Cosmos, index);
      await AppWallet.addAccount(StorageVars.CyberDAccounts, newAccount.address, newAccount.privateKey, { index });
    }
    this.$store.commit(StorageVars.CurrentAccounts, this.$store.state[StorageVars.CyberDAccounts]);
    this.getBalance();
  },
  watch: {
    currentAccount() {
      this.getBalance();
    },
  },
  methods: {
    async getBalance() {
      this.balance = null;
      if (!this.currentAccount) {
        return;
      }
      console.log('this.currentAccount', this.currentAccount);
      this.balance = await CyberD.getBalance(this.currentAccount.address);
    },
  },
  computed: {
    currentAccount() {
      return this.$store.state[StorageVars.Account];
    },
    accounts() {
      return this.$store.state[StorageVars.CurrentAccounts] || [];
    },
    balanceStr() {
      return this.balance === null ? '...' : this.balance;
    },
  },
  data() {
    return {
      balance: null,
    };
  },
};
