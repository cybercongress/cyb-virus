import { AppWallet } from '../../../../../services/data';
import ContentDetails from '../../../../directives/ContentDetails/ContentDetails';
import { StorageVars } from '../../../../../enum';

export default {
  template: require('./TransferCosmos.html'),
  components: { ContentDetails },
  created() {
    this.$cosmos = AppWallet.getCosmosInstance();

    this.inputKeywordsStr = this.keywordsStr;
  },
  methods: {
    async transfer() {
      try {
        const result = await this.$cosmos.transfer(
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

        this.$router.push({ name: 'cabinet-cosmos' });
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
      return this.$store.state[StorageVars.CurrentAccountItem];
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
