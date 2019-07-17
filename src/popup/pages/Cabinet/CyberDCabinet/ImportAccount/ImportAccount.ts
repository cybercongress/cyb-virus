import { KeyPairType, NetworkType, StorageVars } from '../../../../../enum';
import { AppWallet } from '../../../../../services/data';

export default {
  template: require('./ImportAccount.html'),
  methods: {
    async importAccount() {
      if (this.importMethod === 'privateKey') {
        const account = await AppWallet.getAccountByPrivateKey(KeyPairType.Cyber, this.privateKey);
        await AppWallet.addAccount(this.currentAccountGroup.id, NetworkType.CyberD, KeyPairType.Cyber, account.address, account.privateKey);

        // refresh current accounts
        await AppWallet.setCurrentAccountGroup(this.currentAccountGroup);

        this.$router.push({ name: 'cabinet-cyberd' });
      }
    },
  },
  computed: {
    currentAccountGroup() {
      return this.$store.state[StorageVars.CurrentAccountGroup];
    },
  },
  data() {
    return {
      methodList: [{ title: 'Private Key', value: 'privateKey' }],
      importMethod: 'privateKey',
      privateKey: '',
    };
  },
};
