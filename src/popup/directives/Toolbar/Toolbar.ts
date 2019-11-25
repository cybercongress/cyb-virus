import NetworkSelectInput from '../NetworkSelect/NetworkSelectInput/NetworkSelectInput';
import AccountSelectInput from '../AccountSelect/AccountSelectInput/AccountSelectInput';
import { StorageVars } from '../../../services/data';

export default {
  name: 'toolbar',
  template: require('./Toolbar.html'),
  components: { NetworkSelectInput, AccountSelectInput },
  created() {
    this.search = this.$route.query.search || '';
    this.setCurrentCabinet();
  },
  methods: {
    setCurrentCabinet() {
      let cabinetRoute;
      if (this.currentNetwork === 'cyberd') {
        cabinetRoute = { name: 'cabinet-cyberd', query: { search: '' } };
      }
      this.$store.commit(StorageVars.CurrentCabinetRoute, cabinetRoute);
    },
  },
  computed: {
    currentNetwork() {
      return this.$store.state[StorageVars.Network];
    },
    currentCabinet() {
      return this.$store.state[StorageVars.CurrentCabinetRoute];
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
    currentNetwork() {
      this.setCurrentCabinet();
    },
  },
  data() {
    return {
      search: '',
      showNavigation: false,
    };
  },
};
