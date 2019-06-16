import NetworkSelectInput from '../NetworkSelect/NetworkSelectInput/NetworkSelectInput';
import AccountSelectInput from '../AccountSelect/AccountSelectInput/AccountSelectInput';
import { StorageVars } from '../../../services/data';

export default {
  name: 'toolbar',
  template: require('./Toolbar.html'),
  components: { NetworkSelectInput, AccountSelectInput },
  created() {
    this.search = this.$route.query.search || '';
  },
  computed: {
    currentNetwork() {
      return this.$store.state[StorageVars.Network];
    },
    currentCabinet() {
      if (this.currentNetwork === 'cyberd') {
        return { name: 'cabinet-cyberd', query: { search: '' } };
      } else if (this.currentNetwork === 'geesome') {
        return { name: 'cabinet-geesome', query: { search: '' } };
      }
    },
  },
  watch: {
    search() {
      console.log('this.search', this.search);
      if (this.search) {
        this.$router.push({ name: 'cabinet-cyberd-search', query: { search: this.search } });
      } else {
        this.$router.push(this.currentCabinet);
      }
    },
    '$route.query'() {
      if (this.search != this.$route.query.search) {
        this.search = this.$route.query.search || '';
      }
    },
  },
  data() {
    return {
      search: '',
    };
  },
};
