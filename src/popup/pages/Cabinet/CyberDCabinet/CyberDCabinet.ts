import { AppWallet, CoinType, StorageVars } from '../../../../services/data';
import { CyberD } from '../../../../services/cyberd';
import { getPeers } from '../../../../services/backgroundGateway';
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
    if (!this.currentAccount) {
      this.$store.commit(StorageVars.Account, this.accounts[0]);
    }
    this.getBalance();

    getPeers()
      .then((list: any) => {
        this.peersLoading = false;
        this.peersCount = list.length;
        this.peersError = null;
      })
      .catch(err => {
        this.peersLoading = false;
        this.peersError = err;
      });
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
    currentCabinet() {
      return this.$store.state[StorageVars.CurrentCabinetRoute];
    },
  },
  data() {
    return {
      peersLoading: true,
      balance: null,
      bandwidth: null,
      peersError: false,
      peersCount: null,
    };
  },
};
