import { AppWallet } from '../../../../../services/data';
import { addIpfsContentArray } from '../../../../../services/backgroundGateway';
import ContentDetails from '../../../../directives/ContentDetails/ContentDetails';
import { StorageVars } from '../../../../../enum';

const pIteration = require('p-iteration');

export default {
  template: require('./LinkContent.html'),
  components: { ContentDetails },
  created() {
    this.$cyberD = AppWallet.getCyberDInstance();

    this.inputKeywordsStr = this.keywordsStr;
  },
  methods: {
    async link() {
      const keywordHashes = await addIpfsContentArray(this.resultKeywords);

      try {
        const results = await pIteration.mapSeries(keywordHashes, async keywordHash => {
          return this.$cyberD.link(
            {
              address: this.currentAccount.address,
              privateKey: await AppWallet.decryptByPassword(this.currentAccount.encryptedPrivateKey),
            },
            keywordHash,
            this.resultContentHash
          );
        });

        console.log('link results', results);

        this.$notify({
          type: 'success',
          text: 'Successfully linked',
        });

        this.$router.push({ name: 'cabinet-cyberd' });
      } catch (e) {
        console.error(e);
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
      return this.keywords || this.inputKeywordsStr.split(/[ ,]+/);
    },
    contentHash() {
      return this.$route.query.contentHash;
    },
    keywords() {
      return this.$route.query.keywords;
    },
    keywordsStr() {
      return this.keywords ? this.keywords.join(', ') : '';
    },
    currentAccount() {
      return this.$store.state[StorageVars.CurrentAccountItem];
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
      saveToGeesome: false,
    };
  },
};
