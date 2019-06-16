import { AppWallet, CoinType, getIpfsHash, StorageVars } from '../../../../../../services/data';
import { CyberD } from '../../../../../../services/cyberd';

const _ = require('lodash');
const pIteration = require('p-iteration');

export default {
  template: require('./Search.html'),
  created() {
    this.debounceRunSearch = _.debounce(() => {
      this.loading = true;
      this.runSearch();
    }, 300);
    this.debounceRunSearch();
  },
  methods: {
    async runSearch() {
      console.log('runSearch', this.search);
      if (!this.search) {
        this.searchResults = [];
        this.loading = false;
        return;
      }
      this.searchResults = await CyberD.search(await getIpfsHash(this.search));
      this.loading = false;
    },
  },
  watch: {
    async search() {
      this.debounceRunSearch();
    },
  },
  computed: {
    search() {
      return this.$route.query.search;
    },
  },
  data() {
    return {
      loading: true,
      searchResults: [],
    };
  },
};
