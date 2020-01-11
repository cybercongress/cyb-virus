import Vue from 'vue';
import * as Vuex from 'vuex';
import * as _ from 'lodash';
import * as pIteration from 'p-iteration';
import { PermanentStorage, StorageVars } from './data';

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
