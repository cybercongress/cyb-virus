import { restoreBackup } from '../../../../services/backgroundGateway';
import { PermanentStorage, StorageVars } from '../../../../services/data';

export default {
  template: require('./AskRestoreBackup.html'),
  methods: {
    restoreBackup() {
      restoreBackup()
        .then(async () => {
          this.$notify({
            type: 'success',
            text: 'Successfully restored',
          });

          this.$store.commit(StorageVars.EncryptedSeed, await PermanentStorage.getValue(StorageVars.EncryptedSeed));

          try {
            const cyberDAccounts = JSON.parse((await PermanentStorage.getValue(StorageVars.CyberDAccounts)) as any);
            console.log('cyberDAccounts', cyberDAccounts);
            this.$store.commit(StorageVars.CyberDAccounts, cyberDAccounts);
          } catch (e) {}

          this.$router.push({ name: 'login', query: { from: 'restore' } });
        })
        .catch(() => {
          this.$notify({
            type: 'error',
            text: 'Failed to restore backup :(',
          });
        });
    },
  },
  data() {
    return {};
  },
};
