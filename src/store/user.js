import { defineStore } from 'pinia'
import supabase, { getCurrentUser, onAuthStateChange } from '@/utils/supabase'
import { useNotebookStore } from '@/store'

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: {
      username: '',
      avatar_url: '',
      background_url: ''
    },
    subscription: null,
    authSubscription: null
  }),
  actions: {
    setProfile(data) {
      this.profile.username = data.username || ''
      this.profile.avatar_url = data.avatar_url || ''
      this.profile.background_url = data.background_url || ''
    },
    clearProfile() {
      this.profile = { username: '', avatar_url: '', background_url: '' }
    },
    async fetchProfile() {
      const user = getCurrentUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, background_url')
        .eq('id', user.id)
        .single()
      if (!error && data) {
        this.setProfile(data)
        return data
      }
      return null
    },
    subscribeRealtime() {
      const user = getCurrentUser()
      if (!user) return
      this.unsubscribeRealtime()

      this.subscription = supabase
        .channel(`profiles:${user.id}:${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          payload => {
            const newData = payload.new
            if (!newData) return
            this.setProfile(newData)

            const notebook = useNotebookStore()
            if (!notebook.preferences.pause_save_state) {
              if (newData.background_url) {
                notebook.preferences.background = 'custom'
                notebook.preferences.background_url = newData.background_url
              } else {
                notebook.preferences.background = ''
                notebook.preferences.background_url = ''
              }
              notebook.saveState()
            }
          }
        )
        .subscribe()
    },
    unsubscribeRealtime() {
      if (this.subscription) {
        supabase.removeChannel(this.subscription)
        this.subscription = null
      }
    },
    initAuthListener() {
      if (this.authSubscription) return
      const listener = onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
          this.fetchProfile()
          this.subscribeRealtime()
        }
        if (event === 'SIGNED_OUT') {
          this.unsubscribeRealtime()
          this.clearProfile()
        }
      })
      this.authSubscription = listener
    }
  }
})
