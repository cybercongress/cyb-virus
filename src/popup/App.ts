import Vue from 'vue';
import storePlugin from '../services/permanentStore.plugin';

import { MdElevation, MdCheckbox, MdButton, MdIcon, MdField, MdMenu, MdList, MdDrawer } from 'vue-material/dist/components';
import { AppWallet, CoinType, Network, PermanentStorage, StorageVars } from '../services/data';
import NetworkSelectContainer from './directives/NetworkSelect/NetworkSelectContainer/NetworkSelectContainer';
import AccountSelectContainer from './directives/AccountSelect/AccountSelectContainer/AccountSelectContainer';
import PrettyHex from '@galtproject/frontend-core/directives/PrettyHex/PrettyHex';
import Notifications from 'vue-notification';
import PrettyHash from './directives/PrettyHash/PrettyHash';
import Loading from './directives/Loading/Loading';
import '@galtproject/frontend-core/filters';
import { getIsBackupExists, getSettings } from '../services/backgroundGateway';
import { Settings } from '../backgroundServices/types';

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
Vue.component('loading', Loading);

const _ = require('lodash');
const ipRegex = require('ip-regex');

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
  [StorageVars.IpfsUrl]: null,
  [StorageVars.CurrentCabinetRoute]: null,
  [StorageVars.Settings]: null,
});

export default {
  template: require('./App.html'),
  components: { NetworkSelectContainer, AccountSelectContainer },

  async created() {
    (global as any).chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (!request || !request.type) {
        return;
      }
      console.log('request', request);
      if (request.type === 'loading') {
        this.loading = true;
      } else if (request.type === 'loading-end') {
        this.loading = false;
      } else if (request.type === 'page-action' && request.method === 'save-and-link') {
        this.$router.push({ name: 'cabinet-cyberd-save-and-link', query: request.data });
      } else if (request.type === 'page-action' && request.method === 'link') {
        this.$router.push({ name: 'cabinet-cyberd-link', query: request.data });
      }
    });

    this.init();
  },

  async mounted() {},

  methods: {
    async init() {
      if (!this.ready) {
        return;
      }
      this.loading = true;

      this.getSettings();

      AppWallet.setStore(this.$store);
      const path = await PermanentStorage.getValue(StorageVars.Path);
      console.log('path', path);
      if (path) {
        const query = JSON.parse((await PermanentStorage.getValue(StorageVars.Query)) as any);
        this.$router.push({ path, query });

        (global as any).chrome.runtime.sendMessage({ type: 'popup-get-action' });
        this.loading = false;
        return;
      }
      const encryptedSeed = await PermanentStorage.getValue(StorageVars.EncryptedSeed);

      if (!encryptedSeed) {
        this.loadingBackup = true;
        getIsBackupExists()
          .then(ipld => {
            if (!this.loadingBackup) {
              return;
            }
            this.loading = false;
            this.loadingBackup = false;
            if (ipld) {
              this.$router.push({ name: 'ask-restore-backup', query: { ipld } });
            } else {
              this.$router.push({ name: 'new-wallet-welcome' });
            }
          })
          .catch(() => {
            this.loading = false;
            this.loadingBackup = false;
            this.$router.push({ name: 'new-wallet-welcome' });
          });
        return;
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
    getSettings() {
      getSettings([
        Settings.StorageNodeAddress,
        Settings.StorageNodeType,
        Settings.StorageExtensionIpld,
        Settings.StorageExtensionIpldUpdatedAt,
        Settings.StorageExtensionIpnsUpdatedAt,
        Settings.StorageExtensionIpldError,
      ]).then(settings => {
        this.$store.commit(StorageVars.Settings, settings);
      });
    },
  },

  watch: {
    '$route.name'() {
      if (this.$route.name === 'new-wallet-welcome' && this.loadingBackup) {
        this.loadingBackup = false;
        this.loading = false;
      }
      this.setNetwork();
      PermanentStorage.setValue(StorageVars.Path, this.$route.fullPath);
      this.getSettings();
    },
    '$route.query'() {
      PermanentStorage.setValue(StorageVars.Query, JSON.stringify(this.$route.query));
    },
    currentNetwork() {},
    ready() {
      this.init();
    },
    nodeIp() {
      this.$store.commit(StorageVars.IpfsUrl, 'http://' + this.nodeIp + ':8080/ipfs/');
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
    nodeIp() {
      return this.settings && this.settings[Settings.StorageNodeAddress].match(ipRegex());
    },
    settings() {
      return this.$store.state[StorageVars.Settings];
    },
  },
  data() {
    return {
      loading: false,
      loadingBackup: false,
    };
  },
};
