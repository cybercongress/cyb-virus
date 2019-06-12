import Vue from 'vue';
import App from './App';

(global as any).browser = require('webextension-polyfill');

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(App),
});
