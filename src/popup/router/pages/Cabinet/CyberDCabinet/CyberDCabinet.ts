import { AppCrypto, AppWallet, PermanentStorage, StorageVars } from '../../../../../services/data';

export default {
  template: require('./CyberDCabinet.html'),
  async created() {
    if (!this.accounts.length) {
      const accounts = [];
      const index = 0;
      const newAccount = await AppWallet.getAccount('cosmos', index);
      accounts.push({
        address: newAccount.address,
        encryptedPrivateKey: await AppWallet.encryptByPassword(newAccount.privateKey),
        index,
      });
      this.$store.commit(StorageVars.CyberDAccounts, accounts);
    }
  },
  computed: {
    accounts() {
      return this.$store.state[StorageVars.CyberDAccounts] || [];
    },
    encryptedSeed() {
      return this.$store.state[StorageVars.EncryptedSeed];
    },
  },
  data() {
    return {};
  },
};
