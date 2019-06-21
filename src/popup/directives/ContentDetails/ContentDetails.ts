import { getContentByHash } from '../../../services/backgroundGateway';

export default {
  name: 'content-details',
  template: require('./ContentDetails.html'),
  props: ['hash'],
  async created() {
    this.details = await getContentByHash(this.hash);
  },
  watch: {
    async hash() {
      this.details = await getContentByHash(this.hash);
    },
  },
  computed: {},
  data() {
    return {
      details: null,
    };
  },
};
