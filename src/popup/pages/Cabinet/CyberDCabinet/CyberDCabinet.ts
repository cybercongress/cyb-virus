import { AppWallet, CoinType, StorageVars } from '../../../../services/data';
import { CyberD } from '../../../../services/cyberd';
const _ = require('lodash');

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

    (global as any).chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (!request || !_.includes(['show-peers', 'err-peers'], request.type)) {
        return;
      }
      this.peersError = request.type === 'err-peers';
      this.peersCount = this.peersError ? null : request.data.length;
    });

    (global as any).chrome.runtime.sendMessage({ type: 'get-peers-list' });
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
      this.balance = await CyberD.getGigaBalance(this.currentAccount.address);
      this.bandwidth = await CyberD.getBandwidth(this.currentAccount.address);
    },
    downloadPage() {
      (global as any).chrome.runtime.sendMessage({ type: 'download-page' }, response => {});
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
      bandwidth: null,
      peersError: false,
      peersCount: null,
    };
  },
};
