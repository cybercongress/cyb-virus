import { AppWallet, CoinType, StorageVars } from '../../../../../../services/data';
import { CyberD } from '../../../../../../services/cyberd';

const _ = require('lodash');
const pIteration = require('p-iteration');

export default {
  template: require('./LinkHashes.html'),
  methods: {
    async link() {
      await pIteration.forEachSeries(this.keywords, async keyword => {
        return CyberD.link(
          {
            privateKey: AppWallet.encryptByPassword(this.currentAccount.privateKey),
          },
          this.contentHash,
          keyword
        );
      });

      this.$notify({
        type: 'success',
        text: 'Successfully linked',
      });

      this.$router.push({ name: 'cabinet-cyberd' });
    },
  },
  computed: {
    contentHash() {
      return this.$route.query.contentHash;
    },
    keywords() {
      console.log('this.$route.query', this.$route.query);
      return this.$route.query.keywords;
    },
    keywordsStr() {
      return this.keywords.join(', ');
    },
    currentAccount() {
      return this.$store.state[StorageVars.Account];
    },
  },
  data() {
    return {};
  },
};
