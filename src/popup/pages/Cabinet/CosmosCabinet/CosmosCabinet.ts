import { getPeers } from '../../../../services/backgroundGateway';
import { StorageVars } from '../../../../enum';
import { AppWallet } from '../../../../services/data';

export default {
  template: require('./CosmosCabinet.html'),
  async created() {
    this.$cosmos = AppWallet.getCosmosInstance();

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
      this.balance = await this.$cosmos.getMegaBalance(this.currentAccount.address);
    },
    downloadPage() {
      (global as any).chrome.runtime.sendMessage({ type: 'download-page' }, response => {});
    },
  },
  computed: {
    currentAccount() {
      return this.$store.state[StorageVars.CurrentAccountItem];
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
      peersError: false,
      peersCount: null,
    };
  },
};
