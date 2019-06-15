import { AppWallet } from '../../../../../services/data';
import EthData from '@galtproject/frontend-core/libs/EthData';
import Helper from '@galtproject/frontend-core/services/helper';

export default {
  template: require('./CreateWallet.html'),
  created() {
    this.seedPhrase = AppWallet.generateSeed();
  },
  methods: {
    async save() {
      AppWallet.setSeed(this.seedPhrase, this.password);
      this.$router.push({ name: 'cabinet-cyberd' });
    },
    copyToClipboard() {
      Helper.copyToClipboard(this.seedPhrase);
      this.$notify({
        type: 'success',
        title: 'Copied to clipboard!',
      });
    },
  },
  computed: {
    saveDisabled() {
      return !this.savedConfirm || !this.password || this.password.length < 8 || this.password !== this.confirmPassword;
    },
  },
  data() {
    return {
      seedPhrase: null,
      savedConfirm: false,
      password: '',
      confirmPassword: '',
    };
  },
};
