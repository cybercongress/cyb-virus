import { getContentList } from '../../../../../services/backgroundGateway';
import { StorageVars } from '../../../../../enum';

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
