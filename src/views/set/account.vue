<template>
  <div class="account-settings">
    <!-- 账号设置 -->
    <div class="setting-item">
      <h3>编辑个人资料</h3>

      <div v-if="!hasLogin">
        <h3>账号设置</h3>
        <p>请先登录以管理账号信息。</p>
        <!-- 登录注册组件 -->
        <div class="setting-group">
          <button class="primary-btn" @click="showLogin = true">登录</button>
          <button class="default-btn" @click="showRegister = true">注册</button>
        </div>

        <transition appear name="modal-fade">
          <div v-if="showLogin" class="password-modal" @click.self="cancelLogin">
            <div class="password-box">
              <AuthLogin @cancel="cancelLogin" @login-success="onLoginSuccess" />
            </div>
          </div>
        </transition>

        <transition appear name="modal-fade">
          <div v-if="showRegister" class="password-modal" @click.self="cancelRegister">
            <div class="password-box">
              <AuthRegister @cancel="cancelRegister" @register-success="onRegisterSuccess" />
            </div>
          </div>
        </transition>
      </div>

      <div v-else>
        <div class="profile-section">
          <div class="setting-group">
            <label class="setting-label">头像</label>
            <div style="text-align:center">
              <div class="avatar-preview" v-if="profile.avatar_url">
                <img :src="avatarImgUrl" alt="avatar" class="avatar-img" />
              </div>
            </div>
            <div>
              <button class="primary-btn" @click="triggerAvatarInput">上传头像</button>
              <button class="remove-btn" v-if="profile.avatar_url" @click="removeAvatar">删除头像</button>
              <input ref="avatarInput" type="file" accept="image/*" @change="uploadAvatar" style="display:none" />
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">登录名</label>
            <input :value="authUsername" readonly class="default-input" style="width: 60%;" disabled="true"/>
          </div>

          <div class="setting-group">
            <label class="setting-label">昵称</label>
            <input v-model="profile.username" placeholder="昵称" class="default-input" style="width: 60%;"/>
          </div>

          <div class="setting-group">
            <label class="setting-label">保存个人资料</label>
            <button class="save-btn" @click="saveProfile">更新</button>
          </div>
        </div>

        <div class="password-section">
          <h3>账号安全</h3>
          <div class="setting-group">
            <label class="setting-label">账号与密码管理</label>
            <div>
              <button class="primary-btn" @click="showChangePwd = true">修改密码</button>
              <button class="remove-btn" @click="handleSignOut">登出</button>
            <button class="remove-btn" @click="handleDeleteAccount">注销账号</button>
            </div>
          </div>
          <transition appear name="modal-fade">
            <div v-if="showChangePwd" class="password-modal" @click.self="showChangePwd = false">
              <div class="password-box">
                <AuthChangePassword @cancel="showChangePwd = false" @changed="onPasswordChanged" />
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AuthLogin from '@/components/AuthLogin.vue'
import AuthRegister from '@/components/AuthRegister.vue'
import AuthChangePassword from '@/components/AuthChangePassword.vue'
import supabase, { getCurrentUser, onAuthStateChange } from '@/utils/supabase'

export default {
  components: { AuthLogin, AuthRegister, AuthChangePassword },
  data() {
    return {
      showLogin: false,
      showRegister: false,
      showChangePwd: false,
      hasLogin: false,
      authUsername: '',
      avatarImgUrl: '',
      profile: {
        username: '',
        avatar_url: '',
        background_url: ''
      },
      profileSubscription: null,
    }
  },
  created() {
    const u = getCurrentUser()
    if (u) {
      this.hasLogin = true
      this.authUsername = u.email ? u.email.split('@')[0] : ''
      this.fetchProfile()      // start realtime updates immediately for existing session
      this.subscribeProfileRealtime()    }
    onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        this.hasLogin = true
        this.authUsername = session.user ? (session.user.email ? session.user.email.split('@')[0] : '') : ''
        this.fetchProfile()
        this.subscribeProfileRealtime()
      }
      if (event === 'SIGNED_OUT') {
        this.hasLogin = false
      }
    })
  },
  methods: {
    async onLoginSuccess(payload) {
      // payload contains username/password
      this.hasLogin = true
      this.authUsername = payload.username || (getCurrentUser() ? (getCurrentUser().email ? getCurrentUser().email.split('@')[0] : '') : '')
      await this.fetchProfile()
      this.subscribeProfileRealtime()
    },
    onRegisterSuccess(payload) {
      // after register prompt login
      this.hasLogin = true
      this.fetchProfile()
    },
    async fetchProfile() {
      const user = getCurrentUser()
      if (!user) return
      const { data, error } = await supabase.from('profiles').select('username, avatar_url, background_url').eq('id', user.id).single()
      if (!error && data) {
        this.profile.username = data.username || (user.email ? user.email.split('@')[0] : '')
        this.profile.avatar_url = data.avatar_url || ''
        this.profile.background_url = data.background_url || ''
      } else {
        // fallback
        this.profile.username = user.email ? user.email.split('@')[0] : ''
      }
    },
    async saveProfile() {
      const user = getCurrentUser()
      if (!user) { alert('未登录'); return }
      const payload = {
        id: user.id,
        username: this.profile.username,
        avatar_url: this.profile.avatar_url || null,
        background_url: this.profile.background_url || this.$store.state.preferences.background_url || null,
        updated_at: new Date().toISOString()
      }
      const { error } = await supabase.from('profiles').upsert(payload)
      if (error) {
        alert('保存失败: ' + error.message)
      } else {
        // apply locally and avoid echoing back as backup push
        try {
          this.$store.state.__suppress_sync = true
          if (payload.background_url) this.$store.state.preferences.background_url = payload.background_url
          this.$store.commit('saveState')
        } finally { this.$store.state.__suppress_sync = false }
      }
    },

    triggerAvatarInput() { this.$refs.avatarInput.click() },

    async uploadAvatar(event) {
      const file = event.target.files[0]
      if (!file) return

      const user = getCurrentUser()
      if (!user) { alert('请先登录'); return }

      const ext = file.name.split('.').pop()
      const filePath = `${user.id}_${Date.now()}.${ext}`

      const { error } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, file, { upsert: false })

      if (error) {
        alert('上传失败: ' + error.message)
        return
      }

      // 只保存路径
      this.profile.avatar_url = filePath

      await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: filePath,
        updated_at: new Date().toISOString()
      })

      await this.loadAvatar()
    },

    async loadAvatar() {
      const path = this.profile.avatar_url
      if (!path) {
        this.avatarImgUrl = ''
        return
      }

      const { data, error } = await supabase
        .storage
        .from('avatars')
        .download(path)

      if (!error && data) {

        if (this.avatarImgUrl) {
          URL.revokeObjectURL(this.avatarImgUrl)
        }

        this.avatarImgUrl = URL.createObjectURL(data)
      }
    },

    async removeAvatar() {
      const user = getCurrentUser()
      if (!user) { alert('请先登录'); return }

      try {
        // remove the specific uploaded file if we know its name
        const path = this.profile.avatar_url
        if (path) {
          await supabase.storage.from('avatars').remove([path])
        }

        if (this.avatarImgUrl) {
          URL.revokeObjectURL(this.avatarImgUrl)
        }

        this.avatarImgUrl = ''
        this.profile.avatar_url = ''

        await supabase.from('profiles').upsert({
          id: user.id,
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
      } catch (e) {
        alert('删除头像失败: ' + (e.message || e))
      }
    },

    async onPasswordChanged() {
      alert('密码已修改，请重新登录')
      await supabase.auth.signOut()
      if (this.profileSubscription) {
        supabase.removeSubscription(this.profileSubscription)
        this.profileSubscription = null
      }
      this.hasLogin = false
      this.showChangePwd = false
      this.$store.state.preferences.background = ''
      this.$store.state.preferences.background_url = ''
      this.$store.commit('saveState')
    },
    async handleSignOut() {
      if (!confirm('确定要登出吗？')) return
      await supabase.auth.signOut()
      if (this.profileSubscription) {
        supabase.removeSubscription(this.profileSubscription)
        this.profileSubscription = null
      }
      this.hasLogin = false
      // reset background to pure color
      this.$store.state.preferences.background = ''
      this.$store.state.preferences.background_url = ''
      this.$store.commit('saveState')
    },
    // 注销账号：删除 backups、profiles 和 私有背景文件（如存在），然后登出
    async handleDeleteAccount() {
      if (!confirm('确定要注销账号？此操作会删除云端备份与资料，且不可恢复')) return
      const user = getCurrentUser()
      if (!user) { alert('未登录'); return }
      try {
        // 删除私有背景文件（忽略错误）
        try {
          const path = this.$store.state.preferences.background_url || this.profile.background_url
          if (path) await supabase.storage.from('backgrounds').remove([path])
        } catch (e) { /* ignore */ }
        // 删除 backups
        const { error: e1 } = await supabase.from('backups').delete().eq('user_id', user.id)
        if (e1) console.warn('删除backups失败', e1.message)
        // 删除 profile
        const { error: e2 } = await supabase.from('profiles').delete().eq('id', user.id)
        if (e2) console.warn('删除profiles失败', e2.message)
        // sign out
        await supabase.auth.signOut()
        if (this.profileSubscription) {
          supabase.removeSubscription(this.profileSubscription)
          this.profileSubscription = null
        }
        this.hasLogin = false
        this.$store.state.preferences.background = ''
        this.$store.state.preferences.background_url = ''
        this.$store.commit('saveState')
      } catch (err) {
        alert('注销失败: ' + (err.message || err))
      }
    },
    subscribeProfileRealtime() {
      const user = getCurrentUser()
      if (!user) return

      // 防止重复订阅
      if (this.profileSubscription) {
        supabase.removeSubscription(this.profileSubscription)
        this.profileSubscription = null
      }

      this.profileSubscription = supabase
        .from(`profiles:id=eq.${user.id}`)
        .on('UPDATE', (payload) => {

          const newData = payload.new
          if (!newData) return
          console.log('Profile 更新:', newData)

          // 更新本地状态
          this.profile.username = newData.username || ''
          this.profile.avatar_url = newData.avatar_url || ''
          this.loadAvatar() // 头像变化时重新加载
          const newBg = newData.background_url || ''
          this.profile.background_url = newBg

          // 立即覆盖背景（更新为最新的或删除背景）
          const prefs = this.$store.state.preferences
          if (this.$store.state.preferences.pause_save_state) {
            return  // 本地未开启云同步时不自动覆盖背景
          }
          if (newBg) {
            prefs.background = 'custom'
            prefs.background_url = newBg
          } else {
            prefs.background = ''
            prefs.background_url = ''
          }
          this.$store.commit('saveState')
        })
        .subscribe((status) => {
          console.log('Realtime 状态:', status)
        })
    },
    // applyProfileBackground removed: background handled via basic.vue uploads and preferences
    cancelLogin() { this.showLogin = false },
    cancelRegister() { this.showRegister = false },
  },
  watch: {
    'profile.avatar_url': {
      immediate: true,
      handler() {
        this.loadAvatar()
      }
    },
    // 监听背景路径变化并在 custom 模式下同步全局 store
    'profile.background_url': {
      immediate: false,
      handler(newVal) {
        const prefs = this.$store.state.preferences
        if (prefs.background === 'custom') {
          if (newVal) {
            prefs.background_url = newVal
          } else {
            prefs.background = ''
            prefs.background_url = ''
          }
          this.$store.commit('saveState')
        }
      }
    }
  }
}
</script>

<style scoped>
.account-settings {
  padding: 20px;
}

.setting-item {
  margin-bottom: 30px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.setting-item h3 {
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.setting-group {
  display: flex;
  align-items: center;
  margin: 12px 0;
}

.setting-label {
  width: 120px;
  color: #666;
  font-size: 14px;
}

.custom-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 200px;
}

.custom-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 180px;
  margin-right: 10px;
}

.unit {
  color: #999;
  font-size: 14px;
}

.path-selector {
  display: flex;
  align-items: center;
}

.path-input {
  flex: 1;
  margin-right: 10px;
}

.checkbox-item {
  display: flex;
  align-items: center;
}
.checkbox {
  width: 40px;
  height: 20px;
  appearance: none;
  background-color: #bfbfbf;
  border-radius: 20px;
  position: relative;
  transition: all 0.4s;
}
.checkbox::before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}
.checkbox:checked::before {
  transform: translateX(20px);
}
.checkbox:checked {
  background-color: #2196f3;
}

.action-buttons {
  margin-top: 25px;
  text-align: center;
}

.save-btn, .remove-btn, .default-btn, .primary-btn {
  padding: 10px 25px;
  margin: 0 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  appearance: none;
  transition: all 0.3s;
}

.save-btn {
  background: #5fc153;
  color: white;
}

.save-btn:hover {
  background: #4fa044;
}

.remove-btn {
  background: #ed695f;
  color: white;
}

.remove-btn:hover {
  background: #b8524b;
}

.primary-btn {
  background: #057ada;
  color: white;
}

.primary-btn:hover {
  background: #0e67c1;
}

.default-btn {
  background: rgba(0, 0, 0, 0.1);
  color: white;
}

.default-btn:hover {
  background: rgba(0, 0, 0, 0.2);
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  margin-left: 5px;
  color: #666;
}

/* 统一模态框背景 */
.password-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* 统一内容框样式 */
.password-box {
  background: rgba(255, 255, 255, 0.6);
  padding: 50px 0;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* 超链接小字样式 */
.link-text {
  display: inline-block;
  font-size: 14px;
  color: #0078d7;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s;
}

.link-text:hover {
  color: #005bb5;
}

/* 按钮区域布局 */
.modal-actions {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
}

/* 确认按钮样式 */
.btn-confirm {
  padding: 12px 50px;
  border-radius: 8px;
  border: none;
  background-color: #0078d7;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:hover {
  background-color: #0069c0;
  transform: translateY(-1px);
}

/* 取消按钮样式 */
.btn-cancel {
  padding: 12px 50px;
  border-radius: 8px;
  border: none;
  background-color: #888;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background-color: #666;
  transform: translateY(-1px);
}

/* 输入框焦点动画 */
.default-input {
  width: 60%;
  padding: 10px 12px;
  margin: 0 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
}

.default-input:focus {
  border-color: #0078d7;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 120, 215, 0.1);
  transform: translateY(-2px);
}

.avatar-img {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
  margin: 6px auto;
}

.error {
  color: red;
  font-size: 14px;
}

/*transition组件*/
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.4, 1);
}
.modal-fade-enter {
  opacity: 0;
  filter: blur(4px);
}
.modal-fade-enter-to {
  opacity: 1;
  filter: blur(0px);
}
.modal-fade-leave {
  opacity: 1;
  filter: blur(0px);
}
.modal-fade-leave-to {
  opacity: 0;
  filter: blur(4px);
}
</style>
