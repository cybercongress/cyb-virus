import AccountSelectInput from '../AccountSelect/AccountSelectInput/AccountSelectInput';
import { StorageVars } from '../../../enum';

export default {
  name: 'toolbar',
  template: require('./Toolbar.html'),
  components: { AccountSelectInput }, // NetworkSelectInput,
  created() {
    this.search = this.$route.query.search || '';
    this.setCurrentCabinet();
  },
  methods: {
    setCurrentCabinet() {
      let cabinetRoute;
      if (this.currentAccount.networkName === 'cyberd') {
        cabinetRoute = { name: 'cabinet-cyberd', query: { search: '' } };
      } else if (this.currentAccount.networkName === 'geesome') {
        cabinetRoute = { name: 'cabinet-geesome', query: { search: '' } };
      }
      this.$store.commit(StorageVars.CurrentCabinetRoute, cabinetRoute);
    },
  },
  computed: {
    currentAccount() {
      return this.$store.state[StorageVars.CurrentAccountItem];
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
    currentAccount() {
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
