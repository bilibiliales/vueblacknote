<template>
  <div>
    <transition appear>
    <div v-if="showModal" class="password-modal" @click.self="cancelPassword">
      <!-- 密码输入模态框 -->
          <div v-if="preventEdit" class="password-box">
              <h3>编辑被拒绝</h3>
              <p class="error">无法进入编辑，请将任务移出回收站后重试。</p>
              <div class="modal-buttons">
                <button @click="cancelPassword" class="btn-cancel" style="padding: 8px 60px;">返回</button>
              </div>
          </div>
          <div v-else-if="showPasswordModal" class="password-box">
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
  </transition>
  <transition name="main-fade" appear>
    <div v-if="!showModal" class="edit-container" :style="{ backgroundColor: containerColor }">
      <!-- 编辑区域 -->
        <div class="header">
          <h4 class="title-input" :style="{ color: textColor }">{{ currentNote.title }}</h4>
          <span :style="{ color: textColor }">
            最后修改：{{ formatDate(currentNote.updated_at, 'YYYY-MM-DD HH:mm') }}
          </span>
          <div class="controls">
            <button @click="toggleEncryption" class="encryption-btn">
              <img :src="waitingEncrypt ? lockIcon : unlockIcon"
                   alt="加密状态"
                   class="lock-icon" />
            </button>
            <button @click="saveNote" v-if="isEdit" class="save-btn">保存</button>
            <button v-else @click="isEdit=true" class="edit-btn">编辑</button>
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
            v-if="isEdit"
            class="text-editor"
          ></textarea>
          <div v-else-if="$store.state.preferences.enable_markdown" class="markdown-wrapper">
            <MarkdownViewer :source="decryptedContent" class="text-view" />
          </div>
          <textarea v-model="decryptedContent" readonly="readonly" v-else class="text-editor"></textarea>
        </div>
    </div>
  </transition>
  </div>
</template>

  <script>
  import dayjs from 'dayjs';
  import 'dayjs/locale/zh-cn';
  import customParseFormat from 'dayjs/plugin/customParseFormat';
  import MarkdownViewer from '@/components/MarkdownViewer.vue'
  import lockIcon from '@/resource/lock.png'
  import unlockIcon from '@/resource/unlock.png'
  import {
    decodePlainContent,
    decryptNoteContent,
    encodePlainContent,
    encryptNoteContent,
    passwordToKey
  } from '@/utils/noteCrypto'

  dayjs.extend(customParseFormat);
  dayjs.locale('zh-cn');

  export default {
    components: {
      MarkdownViewer
    },
    data() {
      return {
        isEdit: false,
        preventEdit: false,
        currentNote: null,
        decryptedContent: '',
        inputPassword: '',
        encryptionKey: null,
        showPasswordModal: false,
        decryptError: '',
        isEncrypting: false,
        waitingEncrypt: false,
        lockIcon,
        unlockIcon
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
      showModal() {
        return this.preventEdit || this.showPasswordModal;
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
      this.preventEdit = this.currentNote.status=="remove" ? true : false;
      if (this.currentNote.encrypted) {
        this.showPasswordModal = true
      } else {
        this.decryptedContent = decodePlainContent(this.currentNote.content)
      }
    },
    methods: {
      // 密码验证或设置
      handlePassword() {
        if (this.isEncrypting) {
          this.encryptionKey = passwordToKey(this.inputPassword)
          this.waitingEncrypt = true
          this.showPasswordModal = false
        } else {
          try {
            const { key, content } = decryptNoteContent(this.currentNote.content, this.inputPassword)
            this.decryptedContent = content
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
        if (this.preventEdit) {
          this.$router.go(-1)
          return
        }
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
          if (this.waitingEncrypt) {
            if (!this.encryptionKey) {
              alert('请先设置加密密码!')
              return
            }
            content = encryptNoteContent(content, this.encryptionKey)
            this.currentNote.encrypted = true;
          } else {
            content = encodePlainContent(content)
            this.currentNote.encrypted = false;
          }
          this.currentNote.content = content
          this.currentNote.updated_at = new Date().toISOString()

          this.$store.commit('updateNote', this.currentNote)
          this.$store.commit('saveState');
          this.isEdit=false;
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
        this.preventEdit = false;
        this.isEncrypting = false;
        this.encryptionKey = null;
        this.inputPassword = ''

        const newNote = this.$store.state.notes.find(n => n.n_id === newNId);
        if (!newNote) {
          if (this.$route.path !== `/undefined`){
            this.$router.replace('/undefined');//防两层以上空页面
          }
          return;
        }
        //防跳转回来报错
        this.currentNote = newNote;
        this.preventEdit = this.currentNote.status === "remove";

        if (this.currentNote.encrypted) {
          this.showPasswordModal = true;
        } else {
          this.decryptedContent = decodePlainContent(this.currentNote.content);
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
    min-height: 300px;
    margin-top: 15px;
    max-width: 1600px;
    flex: 1;
    display: flex;
  }

  .markdown-wrapper {
    width: 100%;
    height: 500px;
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
    transition: all 0.2s;
  }

  .save-btn:hover {
    background: #3e8e40;
  }

  .edit-btn {
    background: #0078D7;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .edit-btn:hover {
    background-color: #0069c0;
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

  .encryption-btn {
    border-radius: 10%;
    transition: all 0.2s;
  }

  .encryption-btn:hover {
    filter: brightness(0.5);
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
    overflow-y: auto;
    display: block;
    resize: none;
  }

  .text-view {
    width: 97%;
    height: 470px;
    padding: 15px;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    overflow-y: auto;
  }

  .text-view h1,
  .text-view h2,
  .text-view h3,
  .text-view h4,
  .text-view h5,
  .text-view h6 {
    margin: 0.5em 0;
    line-height: 1.2;
    font-weight: 600;
  }

  .text-view p {
    margin: 0.5em 0;
  }

  .text-view ul,
  .text-view ol {
    margin: 0.5em 0;
    padding-left: 2em;
  }

  .text-view li {
    margin: 0.3em 0;
  }

  /* 密码模态框 */
  .password-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.2);
    backdrop-filter: blur(8px);
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
    transition: all 0.2s;
  }

  .password-box input:focus {
    outline: none;
    border-color: #0078d7;
    box-shadow: 0 0 0 3px rgba(0, 120, 215, 0.1);
  }

  .btn-cancel {
    padding: 8px 20px;
    border-radius: 8px;
    border: none;
    background-color: #888;
    color: white;
    cursor: pointer;
    appearance: none;
    min-width: 80px;
    transition: all 0.2s;
  }

  .btn-cancel:hover {
    background-color: #666;
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
    transition: all 0.2s;
  }

  .btn-confirm:hover {
    background-color: #0069c0;
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

    /*transition组件*/
    .edit-scale-enter-active,
    .edit-scale-leave-active {
      transition: all 0.6s cubic-bezier(0.2, 0.8, 0.4, 1);
    }
    .edit-scale-enter {
      opacity: 0;
    }
    .edit-scale-enter-to {
      opacity: 1;
    }
    .edit-scale-leave {
      opacity: 1;
    }
    .edit-scale-leave-to {
      opacity: 0;
    }

    .v-enter-active,
    .v-leave-active {
      transition: all 0.6s cubic-bezier(0.2, 0.8, 0.4, 1);
    }

    .v-enter,
    .v-enter-from {
      transform: translateY(-100%);
      opacity: 0;
    }

    .v-enter-to {
      transform: translateY(0);
      opacity: 1;
    }

    .v-leave {
      transform: translateY(0);
      opacity: 1;
    }

    .v-leave-to {
      transform: translateY(-100%);
      opacity: 0;
    }
</style>
