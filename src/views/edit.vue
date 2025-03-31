<template>
    <!-- 密码输入模态框 -->
    <div v-if="pretendEdit" class="password-modal">
      <div class="password-box">
          <h3>编辑被拒绝</h3>
          <p class="error">无法进入编辑，请将<p class="error">任务移出回收站后重试。</p></p>
          <div class="modal-buttons">
            <button @click="cancelPassword" class="btn-cancel">返回</button>
          </div>
        </div>
    </div>
    <div v-else-if="showPasswordModal" class="password-modal">
        <div class="password-box">
          <h3>{{ isEncrypting ? '设置加密密码' : '请输入密码' }}</h3>
          <p v-if="decryptError" class="error">{{ decryptError }}</p>
          <input 
            type="password" 
            v-model="inputPassword" 
            placeholder="输入密码" 
            @keydown.enter="handlePassword"
          />
          <div class="modal-buttons">
            <button @click="cancelPassword" class="btn-cancel">取消</button>
            <button @click="handlePassword" class="btn-confirm">确认</button>
          </div>
        </div>
    </div>
    <div v-else class="edit-container" :style="{ backgroundColor: containerColor }">
      <!-- 编辑区域 -->
        <div class="header">
          <h4 class="title-input" :style="{ color: textColor }">{{ currentNote.title }}</h4>
          <span :style="{ color: textColor }">
            最后修改：{{ formatDate(currentNote.updated_at, 'YYYY-MM-DD HH:mm') }}
          </span>
          <div class="controls">
            <button @click="toggleEncryption" class="encryption-btn">
              <img :src="waitingEncrypt ? require('../resource/lock.png') : require('../resource/unlock.png')" 
                   alt="加密状态" 
                   class="lock-icon" />
            </button>
            <button @click="saveNote" class="save-btn">保存</button>
          </div>
        </div>
  
        <!-- 标签展示与选择 -->
        <div class="tags-container">
          <div 
            v-for="tag in availableTags" 
            :key="tag.id"
            :class="['tag-item', { active: currentNote.tags.includes(tag.id) }]"
            :style="{ backgroundColor: currentNote.tags.includes(tag.id) ? tag.color : '#ccc' }"
            class="tag-color"
            @click="toggleTag(tag.id)"
          >
          </div>
        </div>
  
        <!-- 编辑器 -->
        <div class="editor-container">
          <textarea
            v-model="decryptedContent"
            class="text-editor"
          ></textarea>
        </div>
      </div>
  </template>
  
  <script>
  import CryptoJS from 'crypto-js'
  import dayjs from 'dayjs';
  import 'dayjs/locale/zh-cn';
  import customParseFormat from 'dayjs/plugin/customParseFormat';

  dayjs.extend(customParseFormat);
  dayjs.locale('zh-cn');
  
  export default {
    data() {
      return {
        pretendEdit: false,
        currentNote: null,
        decryptedContent: '',
        inputPassword: '',
        encryptionKey: null,
        showPasswordModal: false,
        decryptError: '',
        isEncrypting: false,
        waitingEncrypt: false
      }
    },
    computed: {
      availableTags() {
        return this.$store.state.tags.filter(tag => tag.show)
      },
      textColor() {
        const color = this.$store.state.preferences.item_color;
        const rgbaColor = color;
        return rgbaColor;
      },
      containerColor() {
        return this.$store.state.preferences.dark ? '#333333d5' : '#f9f9f9d5';
      },
    },
    created() {
      const noteId = this.$route.params.n_id
      this.currentNote = this.$store.state.notes.find(n => n.n_id === noteId)
      if (!this.currentNote) {
        this.$router.replace('/undefined')
        return
      }

      this.waitingEncrypt=this.currentNote.encrypted;//设置待加密状态
      this.pretendEdit = this.currentNote.status=="remove" ? true : false;
      if (this.currentNote.encrypted) {
        this.showPasswordModal = true
      } else {
        this.decryptedContent = this.decodeBase64(this.currentNote.content).slice(10)
      }
    },
    methods: {
      // Base64解码
      decodeBase64(content) {
        try {
          return CryptoJS.enc.Base64.parse(content).toString(CryptoJS.enc.Utf8)
        } catch (error) {
          console.error('解码失败:', error)
          return content
        }
      },
  
      // 密码验证或设置
      handlePassword() {
        if (this.isEncrypting) {
          this.encryptionKey = CryptoJS.SHA256(this.inputPassword).toString()
          this.waitingEncrypt = true
          this.showPasswordModal = false
        } else {
          try {
            const key = CryptoJS.SHA256(this.inputPassword).toString()
            const bytes = CryptoJS.AES.decrypt(this.currentNote.content, key)
            const base64Content = bytes.toString(CryptoJS.enc.Utf8)
            if (!base64Content) throw new Error('解密失败')

            const saltedContent = this.decodeBase64(base64Content)
            if (!saltedContent.startsWith("BLACKNOTE@")) {
              throw new Error('数据损坏')
            }
            
            this.decryptedContent = saltedContent.slice(10)
            this.encryptionKey = key
            this.showPasswordModal = false
            this.decryptError = ''
          } catch(error) {
            console.log(error);
            this.decryptError = '密码错误，请重试'
            this.inputPassword = ''
          }
        }
      },
  
      cancelPassword() {
        this.showPasswordModal = false
        this.decryptError = ''
        if(!this.isEncrypting){
            this.$router.go(-1);
        }
      },
  
      // 切换加密状态
      toggleEncryption() {
        if (this.waitingEncrypt) {
          this.waitingEncrypt = false
          this.encryptionKey = null
        } else {
          this.isEncrypting = true
          this.showPasswordModal = true
        }
      },
  
      // 切换标签状态
      toggleTag(tagId) {
        const index = this.currentNote.tags.indexOf(tagId)
        if (index === -1) {
          this.currentNote.tags.push(tagId)
        } else {
          this.currentNote.tags.splice(index, 1)
        }
        this.$store.commit('saveState');
      },
  
      // 保存笔记
      saveNote() {
        let content = this.decryptedContent
        try {
          //Base64不允许编码空值，所以在文本前加盐
          const base64Content = CryptoJS.enc.Base64.stringify(
            CryptoJS.enc.Utf8.parse("BLACKNOTE@"+content)
          )

          if (this.waitingEncrypt) {
            if (!this.encryptionKey) {
              alert('请先设置加密密码!')
              return
            }
            content = CryptoJS.AES.encrypt(base64Content, this.encryptionKey).toString()
            this.currentNote.encrypted = true;
          } else {
            content = base64Content
            this.currentNote.encrypted = false;
          }
          this.currentNote.content = content
          this.currentNote.updated_at = new Date().toISOString()
 
          this.$store.commit('updateNote', this.currentNote)
          this.$store.commit('saveState');
          this.$router.go(-1)
        } catch (e) {
          console.error('保存失败:', e)
          alert('保存失败，请检查内容格式')
        }
      },
      formatDate(dateString, format) {
        return dayjs(dateString).format(format);
      },
      handleNoteIdChange(newNId) {
        this.currentNote = null;
        this.decryptedContent = '';
        this.showPasswordModal = false;
        this.pretendEdit = false;
        
        const newNote = this.$store.state.notes.find(n => n.n_id === newNId);
        if (!newNote) {
          if (this.$route.path !== `/undefined`){
            this.$router.replace('/undefined');//防两层以上空页面
          }
          return;
        }
        //防跳转回来报错
        this.currentNote = newNote;
        this.pretendEdit = this.currentNote.status === "remove";
        
        if (this.currentNote.encrypted) {
          this.showPasswordModal = true;
        } else {
          this.decryptedContent = this.decodeBase64(this.currentNote.content).slice(10);
        }
      },
    },
    watch: {
      '$route.params.n_id'(newNId) {
        this.handleNoteIdChange(newNId);
      }
    }
  }
  </script>
  
  <style scoped>
  .edit-container {
    margin: 20px auto;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    flex-direction: column;
    height: 90%;
    width: 95%;
    max-width: 1600px;
  }
  
  /* 标题与按钮 */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-input {
    margin: 5px;
    font-size: 24px;
  }
  
  .controls {
    display: flex;
    gap: 10px;
  }
  
  .lock-icon {
    width: 20px;
    height: 20px;
  }
  
  .save-btn {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .tag-color {
    display: inline-block;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin-right: 5px;
    gap: 10px;
    margin-top: 10px;
    }
  
  /* 编辑器 */
  .editor-container {
    flex: 1;
    min-height: 300px;
    margin-top: 15px;
    display: flex;
  }
  
  .text-editor {
    height: 470px;
    width: 97%;
    padding: 15px;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    resize: none;
  }
  
  /* 密码模态框 */
  .password-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .password-box {
    background: rgba(255,255,255,0.6);
    padding: 50px;
    border-radius: 10px;
    text-align: center;
  }

  .password-box h3 {
    margin-top: 0px;
    font-size: 20px;
  }

  .password-box input {
    padding: 8px;
    border: 1px solid #bbbbbb;
    border-radius: 6px;
  }

  .btn-cancel {
    padding: 8px 20px;
    border-radius: 8px;
    border: none;
    background-color: #666;
    color: white;
    cursor: pointer;
    appearance: none;
    min-width: 80px;
  }

  .btn-confirm {
    padding: 8px 20px;
    border-radius: 8px;
    border: none;
    background-color: #0078d7;
    color: white;
    cursor: pointer;
    appearance: none;
    min-width: 80px;
  }
  
  .modal-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
  }
  
  .error {
    color: red;
    font-size: 14px;
  }
  </style>