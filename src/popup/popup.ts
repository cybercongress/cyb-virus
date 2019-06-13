import Vue from 'vue';
import router from './router';
import './styles/main.scss';
import App from './App';

(global as any).browser = require('webextension-polyfill');

Vue.prototype.$browser = (global as any).browser;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  render: h => h(App),
});
