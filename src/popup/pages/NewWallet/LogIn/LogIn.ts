import { AppWallet, PermanentStorage } from '../../../../services/data';
import { StorageVars } from '../../../../enum';

const cybCrypto = require('../../../../crypto');

export default {
  template: require('./LogIn.html'),
  async created() {
    this.encryptedSeed = await PermanentStorage.getValue(StorageVars.EncryptedSeed);
  },
  methods: {
    async login() {
      await AppWallet.setPassword(this.password);
      this.$router.push({ name: 'cabinet-cyberd' });
    },
  },
  computed: {
    loginDisabled() {
      if (!this.password || !this.encryptedSeed) {
        return true;
      }
      try {
        cybCrypto.decrypt(this.encryptedSeed, this.password);
      } catch (e) {
        return true;
      }
      return false;
    },
  },
  data() {
    return {
      password: '',
    };
  },
};
