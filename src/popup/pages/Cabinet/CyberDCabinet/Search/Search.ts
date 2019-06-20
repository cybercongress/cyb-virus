import { getIpfsHash } from '../../../../../services/data';
import { CyberD } from '../../../../../services/cyberd';
import EthData from '@galtproject/frontend-core/libs/EthData';

const _ = require('lodash');

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
      this.searchResults = this.searchResults.map(item => {
        item.rank = EthData.roundToDecimal(item.rank, 6);
        return item;
      });
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
