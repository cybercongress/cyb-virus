import { restoreBackup } from '../../../../services/backgroundGateway';
import { PermanentStorage } from '../../../../services/data';
import { StorageVars } from '../../../../enum';

export default {
  template: require('./AskRestoreBackup.html'),
  created() {
    if (this.queryIpld) {
      this.ipldInput = this.queryIpld;
    }
  },
  methods: {
    restoreBackup() {
      restoreBackup(this.ipldInput)
        .then(async () => {
          this.$notify({
            type: 'success',
            text: 'Successfully restored',
          });

          this.$store.commit(StorageVars.EncryptedSeed, await PermanentStorage.getValue(StorageVars.EncryptedSeed));

          try {
            const allAccounts = JSON.parse((await PermanentStorage.getValue(StorageVars.AllAccounts)) as any);
            this.$store.commit(StorageVars.AllAccounts, allAccounts);

            const accountsGroups = JSON.parse((await PermanentStorage.getValue(StorageVars.AccountsGroups)) as any);
            this.$store.commit(StorageVars.AccountsGroups, accountsGroups);
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
  computed: {
    queryIpld() {
      return this.$route.query.ipld;
    },
  },
  data() {
    return {
      ipldInput: '',
    };
  },
};
