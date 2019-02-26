import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/init',
      name: 'init-page',
      component: require('@/components/InitPage').default
    },
    {
      // /home?channel=xxx&page=xxx
      // channel 默认为all page 默认为1
      path: '/home',
      name: 'home-page',
      component: require('@/components/HomePage').default
    },
    {
      path: '*',
      redirect: '/init'
    }
  ]
})
