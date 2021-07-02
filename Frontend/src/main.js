import Vue from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faUserSecret } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
Vue.use(require('vue-cookies'))

// Font Awesome stuff
library.add(faUserSecret)
Vue.component('font-awesome-icon', FontAwesomeIcon)

new Vue({
  store,
  router,
  render: h => h(App)
}).$mount('#app')

