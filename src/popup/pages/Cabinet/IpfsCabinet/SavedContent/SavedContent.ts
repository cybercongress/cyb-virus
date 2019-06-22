import { getContentList, getSettings } from '../../../../../services/backgroundGateway';
import { Settings } from '../../../../../backgroundServices/types';
const ipRegex = require('ip-regex');

export default {
  template: require('./SavedContent.html'),
  created() {
    getSettings([Settings.StorageNodeAddress]).then(settings => {
      this.nodeAddress = settings[Settings.StorageNodeAddress];
    });
    getContentList().then(data => {
      this.list = data;
      this.loading = false;
    });
  },
  methods: {},
  watch: {},
  computed: {
    nodeIp() {
      return this.nodeAddress.match(ipRegex());
    },
    ipfsUrl() {
      return 'http://' + this.nodeIp + ':8080/ipfs/';
    },
  },
  data() {
    return {
      loading: true,
      list: [],
      nodeAddress: '',
    };
  },
};
