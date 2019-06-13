import Vue from 'vue';
import storePlugin from '@galtproject/frontend-core/services/store.plugin';

import { MdElevation } from 'vue-material/dist/components';
import 'vue-material/dist/vue-material.min.css';
import 'vue-material/dist/theme/default.css';
import { Network, PermanentStorage } from '../services/data';

const _ = require('lodash');

Vue.use(storePlugin, {
  currentNetwork: Network.CyberD,
  networksList: [{ title: 'CyberD', value: Network.CyberD }, { title: 'Geesome', value: Network.Geesome }],
  currentAccount: null,
});

export default {
  template: require('./App.html'),

  async created() {
    const encryptedSeed = await PermanentStorage.getValue('encryptedSeed');
    console.log('encryptedSeed', encryptedSeed);

    if (!encryptedSeed) {
      return this.$router.push({ name: 'new-wallet-welcome' });
      // return (global as any).chrome.tabs.create({url: (global as any).extension.getURL('popup.html#window')});
    }
    this.setNetwork();
  },

  methods: {
    setNetwork() {
      this.networksList.some(network => {
        if (_.includes(this.$route.name, network.value)) {
          this.$store.commit('currentNetwork', network.value);
          return true;
        }
        return false;
      });
    },
  },

  watch: {
    '$route.name'() {
      // this.setNetwork()
    },
    currentNetwork() {},
  },

  computed: {
    networksList() {
      return this.$store.state.networksList;
    },
  },
  data() {
    return {};
  },
};
