import { AppWallet } from '../../../../services/data';
import Helper from '@galtproject/frontend-core/services/helper';

const appConfig = require('../../../../config');

export default {
  template: require('./CreateWallet.html'),
  created() {
    this.seedPhrase = AppWallet.generateSeed();
  },
  methods: {
    async save() {
      await AppWallet.setSeed(this.seedPhrase, this.password);
      const group = await AppWallet.addAccountGroup(appConfig.baseAccountsGroupTitle);
      await AppWallet.generateBaseCoinsForAccountGroup(group.id);

      AppWallet.setCurrentAccountGroup(group);

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
