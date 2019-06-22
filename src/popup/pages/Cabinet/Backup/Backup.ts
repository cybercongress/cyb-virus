import { getSettingData, Settings } from '../../../../backgroundServices/types';
import { getSettings, setSettings } from '../../../../services/backgroundGateway';
import EthData from '@galtproject/frontend-core/libs/EthData';

export default {
  template: require('./Backup.html'),
  created() {
    getSettings(this.names).then(values => {
      this.values = values;
      this.loading = false;
      getSettings([Settings.StorageExtensionIpldError]).then(values => {
        console.log('StorageExtensionIpldError', values);
        this.backupError = values[Settings.StorageExtensionIpldError];
      });
    });
  },
  methods: {},
  watch: {},
  computed: {
    settingList() {
      return this.names.map(name => {
        return {
          name,
          title: EthData.humanizeKey(name),
          data: getSettingData(name),
        };
      });
    },
  },
  data() {
    return {
      loading: true,
      names: [Settings.StorageExtensionIpld, Settings.StorageExtensionIpldUpdatedAt, Settings.StorageExtensionIpnsUpdatedAt],
      values: null,
      backupError: null,
    };
  },
};
