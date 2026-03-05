<template>
  <div class="auth-box">
    <h3>登录</h3>
    <input v-model="username" placeholder="用户名" class="login-input" />
    <input v-model="password" placeholder="密码" type="password" class="login-input" />
    <div class="error" v-if="error">{{ error }}</div>
    <div class="modal-actions">
      <button class="btn-confirm" @click="handleLogin">登录</button>
      <button class="btn-cancel" @click="$emit('cancel')">取消</button>
    </div>
  </div>
</template>

<script>
import { signInWithUsername } from '../utils/supabase'

export default {
  data() {
    return {
      username: '',
      password: '',
      error: ''
    }
  },
  methods: {
    async handleLogin() {
      this.error = ''
      if (!this.username || !this.password) {
        this.error = '用户名和密码不能为空'
        return
      }
      const { user, error } = await signInWithUsername(this.username, this.password)
      if (error) {
        this.error = error.message || '登录失败'
        return
      }
      this.$emit('login-success', { user, username: this.username, password: this.password })
    }
  }
}
</script>

<style scoped>
.auth-box {
  width: 100%;
  max-width: 400px; /* 限制最大宽度 */
  margin: 0 auto;
  padding: 20px;
  text-align: center;
}

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
  max-width: 270px;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 15px;
  font-size: 14px;
  transition: all 0.2s;
}

.login-input:focus {
  outline: none;
  border-color: #0078d7;
  box-shadow: 0 0 0 3px rgba(0, 120, 215, 0.1);
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
