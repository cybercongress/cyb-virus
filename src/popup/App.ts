import Vue from 'vue';
import storePlugin from '../services/permanentStore.plugin';

import { MdElevation, MdCheckbox, MdButton, MdIcon, MdField, MdMenu, MdList, MdDrawer } from 'vue-material/dist/components';
import { AppWallet, CoinType, Network, PermanentStorage, StorageVars } from '../services/data';
import NetworkSelectContainer from './directives/NetworkSelect/NetworkSelectContainer/NetworkSelectContainer';
import AccountSelectContainer from './directives/AccountSelect/AccountSelectContainer/AccountSelectContainer';
import PrettyHex from '@galtproject/frontend-core/directives/PrettyHex/PrettyHex';
import Notifications from 'vue-notification';
import PrettyHash from './directives/PrettyHash/PrettyHash';

Vue.use(Notifications);

Vue.use(MdCheckbox);
Vue.use(MdButton);
Vue.use(MdIcon);
Vue.use(MdField);
Vue.use(MdMenu);
Vue.use(MdList);
Vue.use(MdDrawer);

Vue.component('pretty-hex', PrettyHex);
Vue.component('pretty-hash', PrettyHash);

const _ = require('lodash');

Vue.use(storePlugin, {
  [StorageVars.Ready]: false,
  [StorageVars.CoinType]: CoinType.Cosmos,
  [StorageVars.Network]: Network.CyberD,
  [StorageVars.NetworkList]: [{ title: 'CyberD', value: Network.CyberD }, { title: 'Geesome', value: Network.Geesome }],
  [StorageVars.Account]: null,
  [StorageVars.Path]: null,
  [StorageVars.EncryptedSeed]: null,
  [StorageVars.CurrentAccounts]: null,
  [StorageVars.CyberDAccounts]: null,
  [StorageVars.GeesomeAccounts]: null,
});

export default {
  template: require('./App.html'),
  components: { NetworkSelectContainer, AccountSelectContainer },

  async created() {
    this.init();
  },

  async mounted() {},

  methods: {
    async init() {
      if (!this.ready) {
        return;
      }
      AppWallet.setStore(this.$store);
      const path = await PermanentStorage.getValue(StorageVars.Path);
      if (path) {
        const query = JSON.parse((await PermanentStorage.getValue(StorageVars.Query)) as any);
        console.log('storage query', query);
        this.$router.push({ path, query });

        (global as any).chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          if (!request || !request.type) {
            return;
          }
          console.log('request', request);
          if (request.type === 'loading') {
            this.loading = true;
          } else if (request.type === 'loading-end') {
            this.loading = false;
          } else if (request.type === 'page-action') {
            this.$router.push({ name: 'cabinet-cyberd-link', query: { contentHash: request.data.contentHash, keywords: request.data.keywords } });
          }
        });

        (global as any).chrome.runtime.sendMessage({ type: 'popup-get-action' });
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
          let coinType = null;
          if (network.value === 'cyberd') {
            coinType = CoinType.Cosmos;
          }
          this.$store.commit(StorageVars.CoinType, coinType);
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
    '$route.query'() {
      PermanentStorage.setValue(StorageVars.Query, JSON.stringify(this.$route.query));
    },
    currentNetwork() {},
    ready() {
      this.init();
    },
  },

  computed: {
    currentNetwork() {
      return this.$store.state[StorageVars.Network];
    },
    networkList() {
      return this.$store.state[StorageVars.NetworkList];
    },
    ready() {
      return this.$store.state[StorageVars.Ready];
    },
  },
  data() {
    return {
      loading: false,
    };
  },
};
