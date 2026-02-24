<template>
  <div class="backup-settings">
    <!-- 备份设置 -->
    <div class="setting-item">
      <h3>备份管理</h3>
      <div class="setting-group">
        <div class="checkbox-item">
          <label for= "pause_save_state" class="setting-label">暂停自动保存</label>
          <input type="checkbox" id="pause_save_state" v-model="$store.state.preferences.pause_save_state" class="checkbox" @change="$store.commit('saveState')">
        </div>
      </div>
      <div class="setting-group">
        <label class="setting-label">导入备份文件</label>
        <div class="path-selector">
          <button class="primary-btn" @click="triggerFileInput">导入</button>
          <input type="file" class="default-btn" accept=".json" @change="handleFileImport" ref="fileInput" style="display: none;">
        </div>
      </div>
      <div class="setting-group">
        <label class="setting-label">导出备份文件</label>
        <button class="save-btn" @click="DownloadData">下载</button>
      </div>
    </div>
    <div class="setting-item">
      <h3>云备份</h3>
      <div class="setting-group">
        <label class="setting-label">云备份设置</label>
        <div v-if="hasLogin">
          <button class="error-btn" @click.prevent="handleCloudSignOut">登出</button>
          <button class="save-btn" @click.prevent="handleCloudUpload">备份</button>
          <button class="primary-btn" @click.prevent="handleCloudImport(decryptedContent)">还原</button>
          <button class="default-btn" @click.prevent="handleCloudDelete">注销</button>
        </div>
        <div v-else>
          <button class="save-btn" @click.prevent="showLogin = true">登录</button>
          <button class="primary-btn" @click.prevent="showRegister = true">注册</button>
        </div>
      </div>
    </div>
    <!-- 登录注册组件 -->
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
</template>
<script>
import CryptoJS from 'crypto-js'
import AuthLogin from '@/components/AuthLogin.vue'
import AuthRegister from '@/components/AuthRegister.vue'
import supabase, { signInWithUsername, signUpWithUsername, getCurrentUser, onAuthStateChange } from '@/utils/supabase'

export default {
  components: { AuthLogin, AuthRegister },
  data() {
    return {
      state_key: 'blacknote_data',
      showLogin: false,
      showRegister: false,
      inputUser: '',
      inputPassword: '',
      encryptionKey: '',
      decryptedContent: '',
      hasLogin: false,
      cloudData: '',
      errorText: '',
      realtimeSub: null,
    }
  },
  created() {
    const user = getCurrentUser()
    if (user) {
      this.hasLogin = true
      this.inputUser = user.email ? user.email.split('@')[0] : ''
      // 不保存密码；需要用户在界面再次输入以进行解密/加密操作
      this.inputPassword = ''
      this.startRealtime()
    }
    // 监听 auth 变化
    onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        const u = session.user
        this.hasLogin = true
        this.inputUser = u.email ? u.email.split('@')[0] : ''
        this.startRealtime()
      }
      if (event === 'SIGNED_OUT') {
        this.hasLogin = false
        this.stopRealtime()
      }
    })
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    // 被子组件触发的登录成功回调，payload 包含 username/password
    async onLoginSuccess(payload) {
      this.inputUser = payload.username
      this.inputPassword = payload.password
      this.hasLogin = true
      this.showLogin = false
      await this.fetchCloudDataSupabase()
      this.startRealtime()
    },
    onRegisterSuccess(payload) {
      // 注册后引导到登录（组件已经创建返回了用户名密码，可直接登录）
      this.inputUser = payload.username
      this.inputPassword = payload.password
      this.showRegister = false
      this.showLogin = true
    },
    cancelLogin() { this.showLogin = false; this.inputPassword = ''; this.errorText = '' },
    cancelRegister() { this.showRegister = false; this.inputPassword = ''; this.errorText = '' },

    // 使用 Supabase 存取备份数据
    async fetchCloudDataSupabase() {
      const user = getCurrentUser()
      if (!user) return { ok: false, message: '未登录' }

      const { data, error } = await supabase
        .from('backups')
        .select('data, updated_at')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        return { ok: false, message: error.message }
      }
      if (!data) {
        return { ok: false, message: '云端暂无备份' }
      }
      this.cloudData = data.data
      try {
        this.importCloudData(this.cloudData)
        return { ok: true }
      } catch (e) {
        return { ok: false, message: '解密失败: ' + e.message }
      }
    },

    async cloudSignOutSupabase() {
      await supabase.auth.signOut({ scope: 'local' })
    },

    async cloudUploadSupabase() {
      const user = getCurrentUser()
      if (!user) return { ok: false, message: '未登录' }
      if (!this.inputPassword) return { ok: false, message: '请先输入用于加密的密码' }

      const encryptionKey = CryptoJS.SHA256(this.inputPassword).toString()
      const localData = this.getLocalData()
      const base64Content = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(localData))
      const encryptedData = CryptoJS.AES.encrypt(base64Content, encryptionKey).toString()

      // upsert
      const payload = { user_id: user.id, data: encryptedData }
      const { error } = await supabase.from('backups').upsert(payload, { onConflict: 'user_id' })
      if (error) return { ok: false, message: error.message }
      return { ok: true }
    },

    async cloudDeleteSupabase() {
      const user = getCurrentUser()
      if (!user) return { ok: false, message: '未登录' }
      const { error } = await supabase.from('backups').delete().eq('user_id', user.id)
      if (error) return { ok: false, message: error.message }
      return { ok: true }
    },

    async handleCloudSignOut() {
      if (!confirm('确定要登出吗？登出后云备份数据不会被删除，但需要重新登录才能访问')) return
      await this.cloudSignOutSupabase()
      this.logout()
    },

    async handleCloudUpload() {
      if (!this.hasLogin) { this.errorText = '请先登录'; return }
      const res = await this.cloudUploadSupabase()
      if (res.ok) alert('备份成功！')
      else this.errorText = res.message || '备份失败'
    },

    async handleCloudDelete() {
      if (!confirm('确定要注销账号吗？注销后云备份将不可找回')) return
      const res = await this.cloudDeleteSupabase()
      if (res.ok) alert('注销成功！')
      else this.errorText = res.message || '注销失败'
      // sign out
      await supabase.auth.signOut()
      this.logout()
    },

    handleCloudImport(params) {
      this.importBackupData(JSON.parse(params))
    },

    importCloudData(cloudData) {
      const key = CryptoJS.SHA256(this.inputPassword).toString()
      const bytes = CryptoJS.AES.decrypt(cloudData, key)
      const base64Content = bytes.toString(CryptoJS.enc.Utf8)
      if (!base64Content) throw new Error('解密失败')
      this.decryptedContent = this.decodeBase64(base64Content)
      this.encryptionKey = key
      this.errorText = ''
    },

    decodeBase64(content) {
      try { return CryptoJS.enc.Base64.parse(content).toString(CryptoJS.enc.Utf8) }
      catch (error) { console.error('解码失败:', error); return content }
    },

    async handleRegister() {
      if (!this.inputUser || !this.inputPassword) { this.errorText = '用户名和密码不能为空'; return }
      const { user, error } = await signUpWithUsername(this.inputUser, this.inputPassword)
      if (error) { this.errorText = error.message; return }
      alert('注册成功，请登录以完成同步')
      this.showRegister = false
      this.showLogin = true
    },

    async handleLogin() {
      if (!this.inputUser || !this.inputPassword) { this.errorText = '用户名和密码不能为空'; return }
      const { user, error } = await signInWithUsername(this.inputUser, this.inputPassword)
      if (error) { this.errorText = error.message; return }
      // 登录成功后 fetch 数据
      this.hasLogin = true
      await this.fetchCloudDataSupabase()
      this.showLogin = false
      this.startRealtime()
    },

    logout() {
      this.encryptionKey = ''
      this.decryptedContent = ''
      this.cloudData = ''
      this.errorText = ''
      this.hasLogin = false
      this.stopRealtime()
    },

    getLocalData() {
      this.$store.commit('saveState')
      let savedState = localStorage.getItem(this.state_key)
      if (savedState == null) {
        savedState = JSON.stringify({ preferences: this.$store.state.preferences, tags: this.$store.state.tags, notes: this.$store.state.notes })
      }
      return savedState
    },

    DownloadData() {
      const savedState = this.getLocalData()
      const blob = new Blob([savedState], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const n_id = Date.now().toString(16)
      a.href = url
      a.download = this.state_key + n_id + '.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },

    importBackupData(json) {
      this.validateBackup(json)
      localStorage.setItem(this.state_key, JSON.stringify(json))
      if (confirm('导入成功！需要立即刷新应用生效吗？')) window.location.reload()
      else { this.$refs.fileInput.value = ''; alert('数据已保存到本地存储，如需生效请刷新页面。') }
    },

    async handleFileImport(event) {
      const file = event.target.files[0]
      if (!file) return
      try {
        const json = await this.readFile(file)
        this.importBackupData(json)
      } catch (error) { alert(`导入失败: ${error.message}`); this.$refs.fileInput.value = '' }
    },

    readFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => {
          try { resolve(JSON.parse(e.target.result)) } catch (e) { reject(new Error('无效的JSON格式')) }
        }
        reader.onerror = () => reject(new Error('文件读取失败'))
        reader.readAsText(file)
      })
    },

    validateBackup(data) {
      if (!data || typeof data !== 'object') throw new Error('无效的备份文件')
      const requiredKeys = ['preferences', 'tags', 'notes']
      requiredKeys.forEach(key => { if (!(key in data)) throw new Error(`缺少必要字段: ${key}`) })
      if (!Array.isArray(data.tags) || !Array.isArray(data.notes)) throw new Error('数据格式不正确')
    },

    // realtime
    startRealtime() {
      const user = getCurrentUser()
      if (!user) return
      if (this.realtimeSub) return
      this.realtimeSub = supabase
        .from(`backups:user_id=eq.${user.id}`)
        .on('UPDATE', payload => {
          if (!this.$store.state.preferences.pause_save_state) {
            const newData = payload.new.data
            try {
              // 尝试用当前密码解密并覆盖
              this.importCloudData(newData)
              const json = JSON.parse(this.decryptedContent)
              localStorage.setItem(this.state_key, JSON.stringify(json))
              // emit reload if needed
              // window.location.reload()
            } catch (e) { console.warn('实时同步解密失败') }
          }
        })
        .subscribe()
    },

    stopRealtime() {
      if (this.realtimeSub) {
        supabase.removeSubscription(this.realtimeSub)
        this.realtimeSub = null
      }
    }
  }
}
</script>

<style scoped>
.backup-settings {
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

.save-btn, .error-btn, .default-btn, .primary-btn {
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

.error-btn {
  background: #ed695f;
  color: white;
}

.error-btn:hover {
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
.login-input {
  width: 60%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 14px;
  transition: all 0.3s;
}

.login-input:focus {
  border-color: #0078d7;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 120, 215, 0.1);
  transform: translateY(-2px);
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
