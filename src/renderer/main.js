import Vue from 'vue'

import App from './App'
import router from './router'
import store from './store'
import fs from 'fs'
import config from './config'

router.beforeEach((to, from, next) => {
  if (to.name === 'init-page') {
    const savedDir = localStorage.getItem('savedDir')
    try {
      fs.accessSync(config.savedDir, fs.constants.F_OK)
      if (savedDir) {
        next({
          path: '/home',
          name: 'home-page'
        })
      } else {
        next()
      }
    } catch (err) {
      if (savedDir) localStorage.removeItem('savedDir')
      next()
    }
  } else {
    next()
  }
})

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  router,
  store,
  template: '<App/>'
}).$mount('#app')
