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

import Vue from 'vue';
import * as Vuex from 'vuex';
import * as _ from 'lodash';
import * as pIteration from 'p-iteration';
import { PermanentStorage } from './data';
import { StorageVars } from '../enum';

Vue.use(Vuex as any);

export default {
  install(Vue, options) {
    options.ready = false;

    const keys = [];
    const mutations = {};
    _.forEach(options, (value, key) => {
      keys.push(key);
      mutations[key] = (state, newValue) => {
        console.log('commit', key, newValue);
        state[key] = newValue;
        PermanentStorage.setValue(key, newValue);
      };
    });

    const $store = new Vuex.Store({
      state: options,
      mutations,
    });

    Vue.prototype.$store = $store;

    pIteration
      .forEach(keys, async key => {
        let value: any = await PermanentStorage.getValue(key);
        if (value) {
          try {
            value = JSON.parse(value);
          } catch (e) {}
          $store.commit(key, value);
        }
      })
      .then(() => {
        $store.commit(StorageVars.Ready, true);
      });
  },
};
