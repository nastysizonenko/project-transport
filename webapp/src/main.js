import 'primeicons/primeicons.css'
import 'primevue/resources/themes/aura-light-green/theme.css'
import '/node_modules/primeflex/primeflex.css'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import { createApp } from 'vue'
import Tooltip from 'primevue/tooltip'
import { createPinia } from 'pinia'
import VueAxios from 'vue-axios'
import axios from 'axios'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  // ripple: true
})
app.use(ToastService)
app.use(ConfirmationService)
app.use(VueAxios, axios)
app.directive('tooltip', Tooltip)

app.mount('#app')
