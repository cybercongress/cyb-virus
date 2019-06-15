import { AppCrypto, AppWallet, PermanentStorage, StorageVars } from '../../../../../services/data';
import { CyberD } from '../../../../../services/cyberd';

export default {
  template: require('./CyberDCabinet.html'),
  async created() {
    if (!this.accounts.length) {
      const accounts = [];
      const index = 0;
      const newAccount = await AppWallet.getAccount('cosmos', index);
      accounts.push({
        address: newAccount.address,
        encryptedPrivateKey: await AppWallet.encryptByPassword(newAccount.privateKey),
        index,
      });
      this.$store.commit(StorageVars.AccountList, accounts);
      this.$store.commit(StorageVars.Account, accounts[0]);
    } else {
      this.getBalance();
    }
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
      return this.$store.state[StorageVars.AccountList] || [];
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
