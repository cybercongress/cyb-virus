import Vue from 'vue';

import 'vue-material/dist/vue-material.min.css';
import 'vue-material/dist/theme/black-green-dark.css';
// import './styles/main.scss';

(global as any).browser = require('webextension-polyfill');

Vue.prototype.$browser = (global as any).browser;

import VueRouter from 'vue-router';
import IpfsContentPage from './IpfsContentPage/IpfsContentPage';

Vue.use(VueRouter);

const router = new VueRouter({
  routes: [
    {
      path: '/:ipfsHash',
      component: IpfsContentPage,
    },
  ],
});

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<router-view></router-view>',
});
