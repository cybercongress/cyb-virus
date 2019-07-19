import Vue from 'vue';

import 'vue-material/dist/vue-material.min.css';
import 'vue-material/dist/theme/black-green-dark.css';
// import './styles/main.scss';

(global as any).browser = require('webextension-polyfill');

Vue.prototype.$browser = (global as any).browser;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  // router,
  // render: h => h(App),
});
