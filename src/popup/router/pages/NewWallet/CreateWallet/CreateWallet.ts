import { AppCrypto, AppWallet, PermanentStorage, StorageVars } from '../../../../../services/data';

const bip39 = require('bip39');

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
