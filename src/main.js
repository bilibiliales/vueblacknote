import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useNotebookStore } from './store'
import { refreshCurrentUser } from './utils/supabase'
import '@/assets/task-board.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Small compatibility layer while the app moves from Vuex call sites to Pinia.
const notebook = useNotebookStore(pinia)
app.config.globalProperties.$store = {
  get state() {
    return notebook
  },
  commit(action, payload) {
    if (typeof notebook[action] !== 'function') {
      throw new Error(`Unknown store action: ${action}`)
    }
    return notebook[action](payload)
  }
}

refreshCurrentUser().finally(() => {
  app.mount('#app')
})
