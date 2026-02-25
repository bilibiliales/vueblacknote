// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'
import supabase, { getCurrentUser, onAuthStateChange } from '@/utils/supabase'

Vue.config.productionTip = false

/* eslint-disable no-new */
let profileSub = null

// listen auth changes and subscribe to profiles realtime to keep background/avatar in sync
onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    const user = session && session.user ? session.user : getCurrentUser()
    if (!user) return
    try {
      if (profileSub) supabase.removeSubscription(profileSub)
      profileSub = supabase
        .from(`profiles:id=eq.${user.id}`)
        .on('UPDATE', payload => {
          if (payload && payload.new) {
            const p = payload.new
            // update store preferences background_url/avatar without causing backup echo
            try {
              store.state.__suppress_sync = true
              if (typeof p.background_url !== 'undefined') store.state.preferences.background_url = p.background_url || ''
              if (typeof p.avatar_url !== 'undefined') {
                // store avatar in preferences? keep in preferences for UI convenience
                // no dedicated field for avatar in preferences currently, but components read profiles separately if needed
              }
              store.commit('saveState')
            } finally {
              store.state.__suppress_sync = false
            }
          }
        })
        .subscribe()
    } catch (e) { console.warn('subscribe profile realtime failed', e) }
  }
  if (event === 'SIGNED_OUT') {
    if (profileSub) {
      try { supabase.removeSubscription(profileSub) } catch (e) { /* ignore */ }
      profileSub = null
    }
  }
})

new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
})
