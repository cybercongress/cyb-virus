import Vue from 'vue';
import storePlugin from '../services/permanentStore.plugin';

import { MdElevation, MdCheckbox, MdButton, MdIcon } from 'vue-material/dist/components';
import { AppWallet, Network, PermanentStorage, StorageVars } from '../services/data';
import NetworkSelectContainer from './directives/NetworkSelect/NetworkSelectContainer/NetworkSelectContainer';
import AccountSelectContainer from './directives/AccountSelect/AccountSelectContainer/AccountSelectContainer';

Vue.use(MdCheckbox);
Vue.use(MdButton);
Vue.use(MdIcon);

const _ = require('lodash');

Vue.use(storePlugin, {
  [StorageVars.Network]: Network.CyberD,
  [StorageVars.NetworkList]: [{ title: 'CyberD', value: Network.CyberD }, { title: 'Geesome', value: Network.Geesome }],
  [StorageVars.Account]: null,
  [StorageVars.Path]: null,
  [StorageVars.EncryptedSeed]: null,
  [StorageVars.AccountList]: null,
  // [StorageVars.GeesomeAccounts]: null,
});

export default {
  template: require('./App.html'),
  components: { NetworkSelectContainer, AccountSelectContainer },

  async created() {
    this.init();
  },

  methods: {
    async init() {
      if (!this.ready) {
        return;
      }
      AppWallet.setStore(this.$store);
      const path = await PermanentStorage.getValue(StorageVars.Path);
      if (path) {
        this.$router.push(path);
        return;
      }
      const encryptedSeed = await PermanentStorage.getValue(StorageVars.EncryptedSeed);

      if (!encryptedSeed) {
        return this.$router.push({ name: 'new-wallet-welcome' });
        // return (global as any).chrome.tabs.create({url: (global as any).extension.getURL('popup.html#window')});
      }
    },
    setNetwork() {
      this.networkList.some(network => {
        if (_.includes(this.$route.name, network.value)) {
          this.$store.commit(StorageVars.Network, network.value);
          return true;
        }
        return false;
      });
    },
  },

  watch: {
    '$route.name'() {
      this.setNetwork();
      PermanentStorage.setValue(StorageVars.Path, this.$route.fullPath);
    },
    currentNetwork() {},
    ready() {
      this.init();
    },
  },

  computed: {
    networkList() {
      return this.$store.state.networkList;
    },
    ready() {
      return this.$store.state.ready;
    },
  },
  data() {
    return {};
  },
};
