import NetworkSelectInput from '../NetworkSelect/NetworkSelectInput/NetworkSelectInput';
import AccountSelectInput from '../AccountSelect/AccountSelectInput/AccountSelectInput';
import { StorageVars } from '../../../services/data';

export default {
  name: 'toolbar',
  template: require('./Toolbar.html'),
  components: { NetworkSelectInput, AccountSelectInput },
  computed: {
    currentNetwork() {
      return this.$store.state[StorageVars.Network];
    },
    currentCabinet() {
      if (this.currentNetwork === 'cyberd') {
        return { name: 'cabinet-cyberd' };
      } else if (this.currentNetwork === 'geesome') {
        return { name: 'cabinet-geesome' };
      }
    },
  },
  data() {
    return {};
  },
};
