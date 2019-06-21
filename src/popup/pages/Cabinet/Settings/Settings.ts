import { getSettingData, Settings } from '../../../../backgroundServices/types';
import { getSettings, setSettings } from '../../../../services/backgroundGateway';
import EthData from '@galtproject/frontend-core/libs/EthData';

export default {
  template: require('./Settings.html'),
  created() {
    getSettings(this.names).then(values => {
      this.values = values;
      this.loading = false;
    });
  },
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
  },
  data() {
    return {
      loading: true,
      names: [Settings.StorageNodeType, Settings.StorageNodeAddress],
      values: null,
    };
  },
};
