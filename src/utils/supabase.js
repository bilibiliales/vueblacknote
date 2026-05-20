import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://spb-rlhyu8k8fmo3ahbk.supabase.opentrust.net'
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsInJlZiI6InNwYi1ybGh5dThrOGZtbzNhaGJrIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjgzMTYyNTksImV4cCI6MjA4Mzg5MjI1OX0.2X0LeKglFp77wMvyoS-WdxZh35xCRVxdlHBxcKVyDAg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

let currentUser = null

supabase.auth.getSession().then(({ data }) => {
  currentUser = data.session?.user || null
})

supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null
})

export async function signUpWithUsername(username, password) {
  const email = `${username}@vueblacknote.com`
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { user: data.user, session: data.session, error }
}

export async function signInWithUsername(username, password) {
  const email = `${username}@vueblacknote.com`
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  currentUser = data.user || currentUser
  return { user: data.user, session: data.session, error }
}

export function getCurrentUser() {
  return currentUser
}

export async function refreshCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (!error) currentUser = data.user || null
  return currentUser
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null
    callback(event, session)
  })
  return data.subscription
}

export default supabase
