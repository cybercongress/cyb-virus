import NetworkSelectInput from '../NetworkSelect/NetworkSelectInput/NetworkSelectInput';
import AccountSelectInput from '../AccountSelect/AccountSelectInput/AccountSelectInput';

export default {
  name: 'toolbar',
  template: require('./Toolbar.html'),
  components: { NetworkSelectInput, AccountSelectInput },
  data() {
    return {};
  },
};
