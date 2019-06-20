import { getContentList } from '../../../../../services/backgroundGateway';

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
  computed: {},
  data() {
    return {
      loading: true,
      list: [],
    };
  },
};