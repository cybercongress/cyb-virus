import { addIpfsContentArray, saveContent } from '../../../../../services/backgroundGateway';
import { AppWallet } from '../../../../../services/data';
import { StorageVars } from '../../../../../enum';

const pIteration = require('p-iteration');

export default {
  template: require('./SaveAndLinkContent.html'),
  created() {
    this.$cyberD = AppWallet.getCyberDInstance();

    this.linkKeywords = this.$route.query.linkKeywords;
    this.inputDescription = this.$route.query.description;
    this.size = this.$route.query.size;
  },
  methods: {
    async saveAndLink() {
      await saveContent({
        contentHash: this.resultContentHash,
        size: this.size,
        description: this.inputDescription,
        keywords: this.resultKeywords,
        mimeType: this.$route.query.mimeType,
      });

      try {
        if (this.linkKeywords) {
          const keywordHashes = await addIpfsContentArray(this.resultKeywords);

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
        }

        this.$notify({
          type: 'success',
          text: this.linkKeywords ? 'Successfully saved and linked' : 'Successfully saved',
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
    disableSaveAndLink() {
      return !(this.contentHash || this.inputContentHash) || (this.linkKeywords && !(this.keywordsStr || this.inputKeywordsStr));
    },
  },
  watch: {
    // async resultContentHash() {
    //   this.size = ((await getIpfsFileStats(this.resultContentHash)) as any).size || 0;
    // }
  },
  data() {
    return {
      inputContentHash: '',
      inputDescription: '',
      inputKeywordsStr: '',
      linkKeywords: false,
      saveToGeesome: false,
    };
  },
};
