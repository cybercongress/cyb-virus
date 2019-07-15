/*
 * Copyright ©️ 2018 Galt•Space Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka),
 * [Dima Starodubcev](https://github.com/xhipster),
 * [Valery Litvin](https://github.com/litvintech) by
 * [Basic Agreement](http://cyb.ai/QmSAWEG5u5aSsUyMNYuX2A2Eaz4kEuoYWUkVBRdmu9qmct:ipfs)).
 * ​
 * Copyright ©️ 2018 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) and
 * Galt•Space Society Construction and Terraforming Company by
 * [Basic Agreement](http://cyb.ai/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS:ipfs)).
 */

import { EventBus, ACCOUNT_SELECT_HIDE, ACCOUNT_SELECT_PREVENT_CLOSE, ACCOUNT_SELECT_SHOW, ACCOUNT_SELECT_ITEM } from '../../../../services/events';
import { StorageVars } from '../../../../enum';

export default {
  name: 'account-select-container',
  template: require('./AccountSelectContainer.html'),
  props: [],
  components: {},
  mounted() {
    this.$refs.container.addEventListener('click', () => {
      EventBus.$emit(ACCOUNT_SELECT_PREVENT_CLOSE, { uniqId: this.uniqId });
    });

    EventBus.$on(ACCOUNT_SELECT_SHOW, config => {
      this.uniqId = config.uniqId;

      this.showContainer = true;
      // this.value = config.value || {};
      // this.localValue = this.value;

      let inputOffset = this.getElOffset(config.input);
      this.top = inputOffset.top + this.getElHeight(config.input) + 5 + 'px';
      this.left = inputOffset.left + 'px';

      const drawer = document.querySelectorAll('.md-app-drawer');
      if (drawer && drawer.length) {
        this.left = inputOffset.left - this.getElWidth(drawer[0]) + 'px';
      }

      // this.width = this.getElWidth(config.input) + 'px';
    });

    EventBus.$on(ACCOUNT_SELECT_HIDE, config => {
      if (this.uniqId != config.uniqId) {
        return;
      }
      this.uniqId = null;
      this.showContainer = false;
    });
  },
  methods: {
    // async addAccount() {
    //   let lastIndex = 0;
    //   this.accountList.forEach(account => {
    //     if (account.index > lastIndex) {
    //       lastIndex = account.index;
    //     }
    //   });
    //   const index = lastIndex + 1;
    //   const newAccount = await AppWallet.generateAccount(this.currentkeyPairType, index);
    //   console.log('newAccount', index, newAccount);
    //   //TODO: get StorageVar of accounts from state
    //   await AppWallet.addAccount(StorageVars.CyberDAccounts, newAccount.address, newAccount.privateKey, { index });
    //   this.$store.commit(StorageVars.CurrentAccounts, this.$store.state[StorageVars.CyberDAccounts]);
    //   this.$store.commit(StorageVars.AppAccountGroup, _.last(this.$store.state[StorageVars.CyberDAccounts]));
    //   this.$router.push(this.currentCabinet);
    // },
    getElOffset(el) {
      const rect = el.getBoundingClientRect();
      const docEl = document.documentElement;

      const top = rect.top + window.pageYOffset - docEl.clientTop;
      const left = rect.left + window.pageXOffset - docEl.clientLeft;
      return { top, left };
    },
    getElHeight(el) {
      return el.offsetHeight;
    },
    getElWidth(el) {
      return el.offsetWidth;
    },
    preventClose() {
      EventBus.$emit(ACCOUNT_SELECT_PREVENT_CLOSE, { uniqId: this.uniqId });
    },
    selectAccountGroupById(id) {
      EventBus.$emit(ACCOUNT_SELECT_ITEM, { uniqId: this.uniqId, groupId: id });
      this.$router.push(this.currentCabinet);
    },
  },
  watch: {},
  computed: {
    currentAccount() {
      return this.$store.state[StorageVars.CurrentAccountGroup];
    },
    accountGroupsList() {
      return this.$store.state[StorageVars.AccountsGroups] || [];
    },
    currentCabinet() {
      return this.$store.state[StorageVars.CurrentCabinetRoute];
    },
  },
  data: function() {
    return {
      showContainer: false,
      top: '0px',
      left: '0px',
      // width: '0px',
      uniqId: null,
    };
  },
};
