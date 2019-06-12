import Vue from 'vue';
import App from './App';
import store from '../store';
import router from './router';

(global as any).browser = require('webextension-polyfill');

Vue.prototype.$browser = (global as any).browser;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  render: h => h(App),
});
