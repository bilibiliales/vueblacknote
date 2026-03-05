<template>
    <div class="basic-settings">
      <!-- 外观设置 -->
      <div class="setting-item">
        <h3>外观设置</h3>
        <div class="setting-group">
          <div class="checkbox-item">
            <label for="dark" class="setting-label">深色模式：</label>
            <input type="checkbox" id="dark" v-model="$store.state.preferences.dark" @click="changeDark" @change="$store.commit('saveState')" class="dark-checkbox">
          </div>
        </div>

        <div class="setting-group">
          <label class="setting-label">主题颜色：</label>
          <input type="color" style="margin-left: 10px;" v-model="$store.state.preferences.item_color" @change="$store.commit('saveState')">
        </div>

        <div class="setting-group">
          <label class="setting-label">设置背景图片：</label>
          <div class="path-selector">
            <select v-model="selectedPreset" class="custom-select">
              <option value="">纯色背景</option>
              <option v-for="p in presets" :key="p" :value="p">{{ p }}</option>
              <option v-if="isLogged" value="custom">自定义背景</option>
            </select>
            <button class="primary-btn" @click="applyPreset">应用背景</button>
            <button class="remove-btn" @click="removePath">清空背景</button>
            <button class="save-btn" @click="triggerFileInput" v-if="isLogged">上传背景</button>
            <input v-if="isLogged" ref="fileInput" type="file" accept="image/*" @change="uploadBackground" class="default-btn" style="display: none;" />
          </div>
        </div>
        <!-- 默认视图设置 -->
        <h3>默认视图</h3>
        <div class="setting-group">
          <label class="setting-label">启动时显示：</label>
          <select v-model="$store.state.preferences.homepage" class="custom-select" @change="$store.commit('saveState')">
            <option value="MainView">主页面</option>
            <option value="pending">待完成</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <div class="setting-group">
          <label class="setting-label">默认视图：</label>
          <select v-model="$store.state.preferences.default_view" class="custom-select" @change="updateDefaultView($event.target.value)">
            <option value="1">列表视图</option>
            <option value="2">卡片视图</option>
          </select>
        </div>
        <div class="setting-group">
          <div class="checkbox-item">
            <label for= "enable_search" class="setting-label">启用标题搜索：</label>
            <input type="checkbox" id="enable_search" v-model="$store.state.preferences.enable_search" class="checkbox" @change="$store.commit('saveState')">
          </div>
        </div>
      </div>
    </div>
  </template>

<script>
import supabase, { getCurrentUser } from '@/utils/supabase'

export default {
  data() {
    return {
      isLogged: false,
      presets: [],
      selectedPreset: '',
      hasCustom: false
    }
  },
  async created() {
    const u = getCurrentUser()
    this.isLogged = !!u
    // load presets from public_backgrounds bucket
    try {
      const { data, error } = await supabase.storage.from('public-backgrounds').list('', { limit: 100 })
      if (!error && Array.isArray(data)) this.presets = data.map(i => i.name)
      // reflect current background in selectedPreset
      const pref = this.$store.state.preferences.background || ''
      if (pref === 'custom') this.selectedPreset = 'custom'
      else if (pref.startsWith && pref.startsWith('preset:')) this.selectedPreset = pref.replace('preset:', '')
      else this.selectedPreset = ''
      // detect whether user already has uploaded custom background by checking profile record
      if (this.isLogged) {
        try {
          const { data: profileData, error: profileErr } = await supabase
            .from('profiles')
            .select('background_url')
            .eq('id', u.id)
            .single()
          if (!profileErr && profileData && profileData.background_url) {
            this.hasCustom = true
          }
          // if preferences already indicate a stored background_url, use that as fallback
          if (this.$store.state.preferences.background_url) this.hasCustom = true
        } catch (e) {
          console.warn('check custom background failed', e)
        }
      }
    } catch (e) { console.warn('无法获取预设背景', e) }
  },
  watch: {
    '$store.state.preferences.background_url'(newVal) {
      this.hasCustom = !!newVal
    }
  },
  methods: {
    triggerFileInput() { this.$refs.fileInput.click(); },
    changeDark() {
      // 当当前为纯色背景（background === ''）时，切换深色/浅色后由 App.vue 的 changeBackground 处理颜色显示。
      if (!this.$store.state.preferences.background || this.$store.state.preferences.background === '') {
        // just save state; App.vue will pick color based on preferences.dark
        this.$store.commit('saveState')
      } else {
        // 如果当前是预设或自定义背景，切换深色不影响背景图片，只保存首选项
        this.$store.commit('saveState')
      }
    },
    updateDefaultView(value) {
      this.$store.state.preferences.default_view=Number(value);
      this.$store.commit('saveState');
    }
    ,
    async applyPreset() {
      const user = getCurrentUser()

      // clear previous setting
      if (!this.selectedPreset) {
        this.$store.state.preferences.background = ''
        this.$store.state.preferences.background_url = ''
        this.$store.commit('saveState')
        return
      }

      if (this.selectedPreset === 'custom') {
        // always verify against the server to avoid stale local state
        if (!user) {
          alert('请先登录')
          return
        }
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('background_url')
            .eq('id', user.id)
            .single()
          const bg = data ? data.background_url : null
          if (error || !bg) {
            alert('当前没有自定义背景，请先上传')
            return
          }
          // store the latest path
          this.hasCustom = true
          this.$store.state.preferences.background = 'custom'
          this.$store.state.preferences.background_url = bg
        } catch (e) {
          console.warn('applyPreset 查询自定义背景失败', e)
          alert('获取自定义背景失败，请稍后重试')
          return
        }
      } else {
        // preset value
        this.$store.state.preferences.background = `preset:${this.selectedPreset}`
        this.$store.state.preferences.background_url = ''
      }
      this.$store.commit('saveState')
    },

    async uploadBackground(event) {
      const file = event.target.files[0]
      if (!file) return
      const user = getCurrentUser()
      if (!user) { alert('请先登录'); return }

      const ext = file.name.split('.').pop()
      const filePath = `${user.id}_${Date.now()}.${ext}`

      const { error } = await supabase
        .storage
        .from('backgrounds')
        .upload(filePath, file, { upsert: false })

      if (error) {
        alert('上传失败: ' + error.message)
        return
      }

      // 只保存文件路径
      this.hasCustom = true
      this.selectedPreset = 'custom'

      this.$store.state.preferences.background = 'custom'
      this.$store.state.preferences.background_url = filePath
      this.$store.commit('saveState')

      // 数据库存 filePath
      await supabase.from('profiles').upsert({
        id: user.id,
        background_url: filePath,
        updated_at: new Date().toISOString()
      })
    },

    // 删除背景：将背景颜色置为深/浅色；若是自定义背景并已登录则删除 bucket 中对应图片
    async removePath() {
      const wasCustom = this.$store.state.preferences.background === 'custom' || this.selectedPreset === 'custom'
      if (wasCustom && this.isLogged) {
        const user = getCurrentUser()
        try {
          const path = this.$store.state.preferences.background_url
          if (path) {
            await supabase.storage.from('backgrounds').remove([path])
          }
          // 将用户背景信息更新到 profiles 表
          const payload = { id: user.id, avatar_url: user.avatar_url, background_url: null, updated_at: new Date().toISOString() }
          await supabase.from('profiles').upsert(payload)
        } catch (e) { console.warn('删除自定义背景失败', e) }
        this.hasCustom = false
      }
      // 设置为色块背景（纯色）
      this.selectedPreset = ''
      this.$store.state.preferences.background = ''
      this.$store.state.preferences.background_url = ''
      this.$store.commit('saveState')
    }
  }
}
</script>

  <style scoped>
  .basic-settings {
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
    padding-bottom: 4px;
  }

  .setting-label {
    width: 120px;
    color: #666;
    font-size: 14px;
    height: 20px;
  }

  .custom-select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    width: 120px;
    transition: all 0.3s;
  }

  .custom-select:focus {
    outline: none;
    opacity: 0.75;
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

  .action-buttons {
    margin-top: 25px;
    text-align: center;
  }

  .save-btn, .default-btn, .primary-btn, .remove-btn {
    padding: 10px 20px;
    margin: 0 10px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .save-btn {
    background: #5fc153;
    color: white;
  }

  .save-btn:hover {
    background: #4fa044;
  }

  .primary-btn {
    background: #057ada;
    color: white;
  }

  .primary-btn:hover {
    background: #0e67c1;
  }

  .remove-btn {
    background-color: #ed695f;
    color: white;
  }

  .remove-btn:hover {
    background: #de493b;
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
  .checkbox-item {
    display: flex;
    align-items: center;
  }
  .dark-checkbox {
    width: 40px;
    height: 20px;
    appearance: none;
    background-color: #bfbfbf;
    border-radius: 20px;
    position: relative;
    transition: all 0.4s;
  }
  .dark-checkbox::before {
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
  .dark-checkbox:checked::before {
    transform: translateX(20px);
  }
  .dark-checkbox:checked {
    background-color: #111;
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
  </style>
