import { AppWallet, StorageVars } from '../../../../../services/data';
import { CyberD } from '../../../../../services/cyberd';
import ContentDetails from '../../../../directives/ContentDetails/ContentDetails';

export default {
  template: require('./TransferCyb.html'),
  components: { ContentDetails },
  created() {
    this.inputKeywordsStr = this.keywordsStr;
  },
  methods: {
    async transfer() {
      try {
        const result = await CyberD.transfer(
          {
            address: this.currentAccount.address,
            privateKey: await AppWallet.decryptByPassword(this.currentAccount.encryptedPrivateKey),
          },
          this.addressTo,
          this.amount
        );
        console.log('transfer result', result);
        this.$notify({
          type: 'success',
          text: 'Successfully transfered',
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
    currentAccount() {
      return this.$store.state[StorageVars.Account];
    },
    disableTransfer() {
      return !this.addressTo || !this.amount;
    },
  },
  data() {
    return {
      addressTo: '',
      amount: null,
    };
  },
};
