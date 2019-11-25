import { getContentList } from '../../../../../services/backgroundGateway';
import { StorageVars } from '../../../../../services/data';

export default {
  template: require('./SavedContent.html'),
  created() {
    getContentList().then(data => {
      this.list = data;
      this.loading = false;
    });
  },
  methods: {},
  watch: {},
  computed: {
    ipfsUrl() {
      // return this.$store.state[StorageVars.ExtensionTabPageUrl] + '#/';
      return this.$store.state[StorageVars.IpfsUrl];
    },
  },
  data() {
    return {
      loading: true,
      list: [],
    };
  },
};
