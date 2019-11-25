const _ = require('lodash');
import { AppWallet, StorageVars } from '../../../../../services/data';
import { CyberD } from '../../../../../services/cyberd';
import { addIpfsContentArray, saveContent } from '../../../../../services/backgroundGateway';
import ContentDetails from '../../../../directives/ContentDetails/ContentDetails';

const pIteration = require('p-iteration');

export default {
  template: require('./LinkContent.html'),
  components: { ContentDetails },
  created() {
    this.inputKeywordsStr = this.keywordsStr;
  },
  methods: {
    async link() {
      console.log('this.inputKeywordsStr', this.inputKeywordsStr);
      console.log('this.keywords', this.keywords);
      console.log('this.resultKeywords', this.resultKeywords);
      console.log('this.$route.query.keywords', this.$route.query.keywords);
      const keywordHashes = await addIpfsContentArray(this.resultKeywords);

      try {
        const results = await pIteration.mapSeries(keywordHashes, async keywordHash => {
          return CyberD.link(
            {
              address: this.currentAccount.address,
              privateKey: await AppWallet.decryptByPassword(this.currentAccount.encryptedPrivateKey),
            },
            keywordHash,
            this.resultContentHash
          );
        });

        await saveContent({
          contentHash: this.resultContentHash,
          keywords: this.resultKeywords,
        });

        console.log('link results', results);

        this.$notify({
          type: 'success',
          text: 'Successfully linked',
        });

        this.$router.push({ name: 'cabinet-cyberd' });
      } catch (e) {
        this.$notify({
          type: 'error',
          title: e && e.message ? e.message : e || 'Unknown error',
          text: e && e.data ? e.data : '',
        });
      }
    },
  },
  computed: {
    resultContentHash() {
      return this.contentHash || this.inputContentHash;
    },
    resultKeywords() {
      return this.inputKeywordsStr.split(/[ ,]+/);
    },
    contentHash() {
      return this.$route.query.contentHash;
    },
    keywords() {
      return _.isArray(this.$route.query.keywords) ? this.$route.query.keywords : this.$route.query.keywords ? this.$route.query.keywords.split(/[ ,]+/) : null;
    },
    keywordsStr() {
      return this.keywords ? this.keywords.join(', ') : '';
    },
    currentAccount() {
      return this.$store.state[StorageVars.Account];
    },
    disableLink() {
      return !(this.contentHash || this.inputContentHash) || !(this.keywordsStr || this.inputKeywordsStr);
    },
  },
  data() {
    return {
      contentDetails: null,
      inputContentHash: '',
      inputDescription: '',
      inputKeywordsStr: '',
    };
  },
};
