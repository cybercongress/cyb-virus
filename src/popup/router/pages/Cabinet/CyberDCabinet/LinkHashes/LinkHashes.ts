import { AppWallet, CoinType, getIpfsHash, StorageVars } from '../../../../../../services/data';
import { CyberD } from '../../../../../../services/cyberd';

const _ = require('lodash');
const pIteration = require('p-iteration');

export default {
  template: require('./LinkHashes.html'),
  methods: {
    async link() {
      const results = await pIteration.mapSeries(this.resultKeywords, async keyword => {
        return CyberD.link(
          {
            address: this.currentAccount.address,
            privateKey: await AppWallet.decryptByPassword(this.currentAccount.encryptedPrivateKey),
          },
          await getIpfsHash(keyword),
          this.resultContentHash
        );
      });
      console.log('link results', results);

      this.$notify({
        type: 'success',
        text: 'Successfully linked',
      });

      this.$router.push({ name: 'cabinet-cyberd' });
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
      return this.$store.state[StorageVars.Account];
    },
    disableLink() {
      return !(this.contentHash || this.inputContentHash) || !(this.keywordsStr || this.inputKeywordsStr);
    },
  },
  data() {
    return {
      inputContentHash: '',
      inputKeywordsStr: '',
      saveToGeesome: false,
    };
  },
};
