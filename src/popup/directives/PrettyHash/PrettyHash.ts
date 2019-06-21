export default {
  name: 'pretty-hash',
  template: require('./PrettyHash.html'),
  // components: { NetworkSelectInput, AccountSelectInput },
  props: ['hash'],
  created() {
    // this.search = this.$route.query.search || '';
  },
  computed: {
    link() {
      if (this.hash.length > 46) {
        return 'http://geesome.galtproject.io/#/content/' + this.hash;
      } else {
        return 'https://cloudflare-ipfs.com/ipfs/' + this.hash;
      }
    },
  },
  data() {
    return {};
  },
};
