import { getContentDataByHash } from '../../services/backgroundGateway';

export default {
  template: require('./IpfsContentPage.html'),
  components: {},
  async mounted() {
    const contentData = await getContentDataByHash(this.$route.params.ipfsHash);
    document.write(Buffer.from(contentData['data']).toString('utf8'));
  },
  data() {
    return {
      content: '',
    };
  },
};
