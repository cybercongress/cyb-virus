import { getSettingData, Settings } from '../../../../backgroundServices/types';
import { setSettings } from '../../../../services/backgroundGateway';
import EthData from '@galtproject/frontend-core/libs/EthData';
import { StorageVars } from '../../../../enum';

export default {
  template: require('./Settings.html'),
  created() {},
  methods: {
    save() {
      setSettings(this.nameValueArr)
        .then(() => {
          this.$notify({
            type: 'success',
            title: 'Successfully saved!',
          });
        })
        .catch(e => {
          this.$notify({
            type: 'error',
            title: 'Unexpected error',
            text: e && e.message ? e.message : e,
          });
        });
    },
  },
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
    nameValueArr() {
      return this.names.map(name => {
        return {
          name,
          value: this.values[name],
        };
      });
    },
    values() {
      return this.$store.state[StorageVars.Settings];
    },
    loading() {
      return !this.$store.state[StorageVars.Settings];
    },
  },
  data() {
    return {
      names: [Settings.StorageNodeType, Settings.StorageNodeAddress],
    };
  },
};
