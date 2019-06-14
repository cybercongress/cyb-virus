import { AppCrypto, StorageVars } from '../../../../../services/data';

const bip39 = require('bip39');

export default {
  template: require('./CreateWallet.html'),
  created() {
    this.seedPhrase = bip39.generateMnemonic();
  },
  methods: {
    async save() {
      this.$store.commit(StorageVars.EncryptedSeed, AppCrypto.encrypt(this.seedPhrase, this.password));
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
