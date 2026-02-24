import { createClient } from '@supabase/supabase-js'

// supabase url和anon key
const SUPABASE_URL = 'https://spb-rlhyu8k8fmo3ahbk.supabase.opentrust.net'
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi1ybGh5dThrOGZtbzNhaGJrIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjgzMTYyNTksImV4cCI6MjA4Mzg5MjI1OX0.2X0LeKglFp77wMvyoS-WdxZh35xCRVxdlHBxcKVyDAg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function signUpWithUsername(username, password) {
  const email = `${username}@vueblacknote.com`
  return await supabase.auth.signUp({ email, password })
}

export async function signInWithUsername(username, password) {
  const email = `${username}@vueblacknote.com`
  return await supabase.auth.signIn({ email, password })
}

export function getCurrentUser() {
  return supabase.auth.user()
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

export default supabase
