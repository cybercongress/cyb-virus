export default {
  template: require('./SavedContent.html'),
  created() {
    (global as any).chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (!request || request.type != 'show-content-list') {
        return;
      }
      this.list = request.data;
      this.loading = false;
    });

    (global as any).chrome.runtime.sendMessage({ type: 'get-content-list' });

    // this.debounceRunSearch = _.debounce(() => {
    //   this.loading = true;
    //   this.runSearch();
    // }, 300);
    // this.debounceRunSearch();
  },
  methods: {
    async runSearch() {
      // console.log('runSearch', this.search);
      // if (!this.search) {
      //   this.searchResults = [];
      //   this.loading = false;
      //   return;
      // }
      // this.searchResults = await CyberD.search(await getIpfsHash(this.search));
      // this.searchResults = this.searchResults.map(item => {
      //   item.rank = EthData.roundToDecimal(item.rank, 6);
      //   return item;
      // });
      // this.loading = false;
    },
  },
  watch: {
    async search() {
      // this.debounceRunSearch();
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
      list: [],
    };
  },
};
