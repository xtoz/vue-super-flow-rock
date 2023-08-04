import Vue from 'vue'
import App from './App'
import SuperFlow from '../packages/index'

SuperFlow.install(Vue);

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
