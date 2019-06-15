import { AppWallet, CoinType, getIpfsHash, StorageVars } from '../../../../../../services/data';
import { CyberD } from '../../../../../../services/cyberd';

const _ = require('lodash');
const pIteration = require('p-iteration');

export default {
  template: require('./LinkHashes.html'),
  methods: {
    async link() {
      const results = await pIteration.mapSeries(this.keywords, async keyword => {
        return CyberD.link(
          {
            address: this.currentAccount.address,
            privateKey: await AppWallet.decryptByPassword(this.currentAccount.encryptedPrivateKey),
          },
          await getIpfsHash(keyword),
          this.contentHash
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
