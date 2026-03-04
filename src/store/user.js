import supabase, { getCurrentUser, onAuthStateChange } from '@/utils/supabase'
import { computed } from 'vue'
import { useStore } from 'vuex'

const state = {
  profile: {
    username: '',
    avatar_url: '',
    background_url: ''
  },
  subscription: null
}

const mutations = {
  setProfile(state, data) {
    state.profile.username = data.username || ''
    state.profile.avatar_url = data.avatar_url || ''
    state.profile.background_url = data.background_url || ''
  },
  clearProfile(state) {
    state.profile = { username: '', avatar_url: '', background_url: '' }
  },
  setSubscription(state, sub) {
    state.subscription = sub
  },
  clearSubscription(state) {
    state.subscription = null
  }
}

const actions = {
  async fetchProfile({ commit }) {
    const user = getCurrentUser()
    if (!user) return null
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url, background_url')
      .eq('id', user.id)
      .single()
    if (!error && data) {
      commit('setProfile', data)
      return data
    }
    return null
  },

  async subscribeRealtime({ commit, state, rootState }) {
    const user = getCurrentUser()
    if (!user) return
    if (state.subscription) {
      try { supabase.removeSubscription(state.subscription) } catch (e) { /* ignore */ }
      commit('clearSubscription')
    }
    const sub = supabase
      .from(`profiles:id=eq.${user.id}`)
      .on('UPDATE', payload => {
        const newData = payload.new
        if (!newData) return
        commit('setProfile', newData)
        // sync background into preferences (similar to account.vue logic)
        if (!rootState.preferences.pause_save_state) {
          const prefs = rootState.preferences
          if (newData.background_url) {
            prefs.background = 'custom'
            prefs.background_url = newData.background_url
          } else {
            prefs.background = ''
            prefs.background_url = ''
          }
          // persist root preferences
          commit('saveState', null, { root: true })
        }
      })
      .subscribe()
    commit('setSubscription', sub)
  },

  unsubscribeRealtime({ state, commit }) {
    if (state.subscription) {
      try { supabase.removeSubscription(state.subscription) } catch (e) { /* ignore */ }
      commit('clearSubscription')
    }
  },

  initAuthListener({ dispatch, commit }) {
    onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        dispatch('fetchProfile')
        dispatch('subscribeRealtime')
      }
      if (event === 'SIGNED_OUT') {
        dispatch('unsubscribeRealtime')
        commit('clearProfile')
      }
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

export function useUserStore() {
  const store = useStore()
  return {
    profile: computed(() => store.state.user.profile),
    fetchProfile: () => store.dispatch('user/fetchProfile'),
    subscribeRealtime: () => store.dispatch('user/subscribeRealtime'),
    unsubscribeRealtime: () => store.dispatch('user/unsubscribeRealtime'),
    initAuthListener: () => store.dispatch('user/initAuthListener')
  }
}
