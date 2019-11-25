import { EventBus, ACCOUNT_SELECT_HIDE, ACCOUNT_SELECT_PREVENT_CLOSE, ACCOUNT_SELECT_SHOW, ACCOUNT_SELECT_ITEM } from '../../../../services/events';
import { StorageVars } from '../../../../services/data';

export default {
  name: 'account-select-input',
  template: require('./AccountSelectInput.html'),
  props: ['value', 'disabled', 'emptyLabel', 'items'],
  async created() {
    this.uniqId = Math.random()
      .toString(36)
      .substr(2, 9);

    EventBus.$on(ACCOUNT_SELECT_PREVENT_CLOSE, data => {
      if (this.uniqId != data.uniqId) return;

      this.preventClose();
    });

    EventBus.$on(ACCOUNT_SELECT_ITEM, item => {
      if (this.uniqId != item.uniqId) return;

      this.$store.commit(StorageVars.Account, item.account);
      this.showList = false;
      EventBus.$emit(ACCOUNT_SELECT_HIDE, { uniqId: this.uniqId });
    });
  },
  mounted() {
    document.body.addEventListener('click', () => {
      this.onClickOutside();
    });

    this.$refs.input.addEventListener('click', () => {
      this.preventClose();
    });
  },
  methods: {
    openContainer() {
      if (this.showList) return;

      EventBus.$emit(ACCOUNT_SELECT_SHOW, {
        uniqId: this.uniqId,
        input: this.$refs.input,
        value: this.value,
      });

      this.showList = true;
    },
    onClickOutside() {
      setTimeout(() => {
        if (this.isPreventClose) {
          return;
        }
        this.showList = false;
        EventBus.$emit(ACCOUNT_SELECT_HIDE, { uniqId: this.uniqId });
      }, 200);
    },
    preventClose() {
      this.isPreventClose = true;
      setTimeout(() => {
        this.isPreventClose = false;
      }, 300);
    },
    updateValue(value) {
      this.$emit('input', value);
      this.$emit('change', value);
    },
  },
  watch: {
    '$route.name'() {
      this.showList = false;
      EventBus.$emit(ACCOUNT_SELECT_HIDE, { uniqId: this.uniqId });
    },
  },
  computed: {
    currentNetwork() {
      return this.$store.state[StorageVars.Network];
    },
  },
  data() {
    return {
      avatarImage:
        "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAADwElEQVR4Xu3dsXEVQRBF0VEYJICJKUsxgIOPQVHEQgiULHxZOCRABDhUkQDKQgRxjKdFV35r5r+++7qn//7dm8fbL08H/j5/ewPR5/z9+UDx3+9fU7wGv/30h/7Fq7v3FP/1wy+KvwkA0u8EQA5ABOUAlQACqBJQD0AA1QOQfKceoFNApwC6hjoGdgwkgJoDNAcggDS4OUBzAGKoOUBzAAKoOUBzAAKoOQDJ1xzgNAdoDkDXUHOAi88B9Bik53hdn+g956z3r+tzD6AJ0A+g6wcA3hGkCQgA6yFUvxwALUATsL6AAiAA7KbQNcG6Pua/JlATsLbQAKgJJAbWAOv69QCU/uYAfE+cEqwlCPNfD6AJCIDmAHQRKoC0eKNg/zo0B8gB6CLMAezHsZ0CCL9OAZ0C8JY0dTAtoTfvfv+g5wOsb+hQAdEA5sdAvas4AJAAvQIV4ADAJ3Rg/nOASoB14TnAuInKAWoCiYF6gPFPu9RCKfvPYBRcE1gTSAx3DCT59pPAHCAHIIRzAJIvB5g/6rUm0H5bmAPkAH0ZJAw0B2gOIPzw1+mdAjoFEIA3t/cf6X4AWr3guQIBME/BdgMBsNV/vnoAzFOw3UAAbPWfrx4A8xRsNxAAW/3nqwfAPAXbDQTAVv/56gEwT8F2AwGw1X++egDMU7DdQABs9Z+vHgDzFGw3EABb/eerB8A8BdsNXP4JIVv5fHW9qVVvSQsAzyH9hwDAXweT+s8gOAACgDCsBJB8++AcIAcgCnMAkm8fnAPkAERhDkDy7YNzgByAKMwBSL59cA6QAxCFOQDJtw/OAXIAojAHIPn2wTlADkAUsgPo+wJo9+fMHzKl+9crWJ/wofvnh0TpBtZPG9f9BwAqGAD2mDeU/+QAqGAOgALmADkAIaRdMC1+/MWZNYHj5wwGAL4xRAWsBFQCiKFKAMnXKcDkqwdQ/ZoE3lUCCKJKAMlXCTD5KgGqXyWgEvBAEFUCSL5KgMn3H5SA9fsC9ArWL2MUgKvvf/6EkKsLePX9BwBaQAC8cAEDIABIgXUPUwmg9O1fHYvbPwGAClYCXriAARAApEA9AP4yaC1gDkD8X7+JCoAAIAXWDtYpgNJ3fQcLgADYvj386jX06vvPAV66AzzefnlCDabh6yZKHWAq3jmH3xew/gABYBkIANPv5AAooIbnAKZgDmD65QCoH4fnACZhDmD65QCoH4fnACZhDmD65QCoH4fnACZhDmD65QCoH4fnACZhDmD65QCoH4fnACZhDmD65QCoH4fnACbhP21BTB26VaD0AAAAAElFTkSuQmCC')",
    };
  },
};
