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

import { EventBus, NETWORK_SELECT_HIDE, NETWORK_SELECT_PREVENT_CLOSE, NETWORK_SELECT_SHOW } from '../../../../services/events';

export default {
  name: 'network-select-container',
  template: require('./NetworkSelectContainer.html'),
  props: [],
  components: {},
  mounted() {
    this.$refs.container.addEventListener('click', () => {
      EventBus.$emit(NETWORK_SELECT_PREVENT_CLOSE, { uniqId: this.uniqId });
    });

    EventBus.$on(NETWORK_SELECT_SHOW, config => {
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

    EventBus.$on(NETWORK_SELECT_HIDE, config => {
      if (this.uniqId != config.uniqId) {
        return;
      }
      this.uniqId = null;
      this.showContainer = false;
    });
  },
  methods: {
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
      EventBus.$emit(NETWORK_SELECT_PREVENT_CLOSE, { uniqId: this.uniqId });
    },
  },
  watch: {},
  computed: {
    currentNetwork() {
      return this.$store.state.network;
    },
    networkList() {
      return this.$store.state.networkList;
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
