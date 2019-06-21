import { getSettingData, Settings } from '../../../../backgroundServices/types';
import { getSettings, setSettings } from '../../../../services/backgroundGateway';
import EthData from '@galtproject/frontend-core/libs/EthData';

export default {
  template: require('./Backup.html'),
  created() {
    getSettings(this.names).then(values => {
      this.values = values;
      this.loading = false;
      getSettings([Settings.StorageExtensionIpdError]).then(values => {
        console.log('StorageExtensionIpdError', values);
        this.backupError = values[Settings.StorageExtensionIpdError];
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
      names: [Settings.StorageExtensionIpd, Settings.StorageExtensionIpdUpdatedAt],
      values: null,
      backupError: null,
    };
  },
};
