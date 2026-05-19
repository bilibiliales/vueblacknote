<template>
  <div>
    <transition :name="transName" mode="out-in" appear>
      <div :key="views === 1 ? 'list' : 'card'">
        <div v-if="views === 1" class="list-views">
          <transition-group name="task" tag="div">
            <div
              v-for="(note, index) in filteredNotes"
              :key="note.n_id"
              :style="{ backgroundColor: listBgColor, transitionDelay: (index * 0.05) + 's' }"
              class="list-note"
            >
              <span class="list-left">
                <h4 :style="{ color: textColor }">{{ formatDate(note.created_at, 'DD') }}</h4>
                <span :style="{ color: textColor }">{{ formatDate(note.created_at, 'MMM') }}</span>
              </span>
              <span class="list-middle">
                <span :style="{ color: textColor }" class="time">{{ formatDate(note.created_at, 'HH:mm') }}</span>
                <input
                  type="text"
                  v-model="note.title"
                  class="title-input"
                  :style="{ color: textColor }"
                  @change="$store.commit('saveState')"
                />
                <span
                  v-for="tagId in note.tags"
                  :key="tagId"
                  v-if="$store.state.tags.find(t => t.id === tagId).show"
                  class="tag-color"
                  :style="{ backgroundColor: getTagColor(tagId) }"
                ></span>
              </span>
              <span class="list-right">
                <span class="encrypted" v-if="note.encrypted">
                  <img src="../resource/lock.png" alt="加密" class="lock-icon" />
                </span>
                <span v-else class="encrypted"></span>
                <button v-if="showEditButton" @click="editNote(note.n_id)" class="edit-button">查看/编辑</button>
                <button
                  v-if="showForceDelete"
                  @click="removeForce(note)"
                  class="force-delete-button"
                >
                  彻底删除
                </button>
                <select
                  v-model="note.status"
                  @click="setPreviousStatus(note)"
                  @change="removeList(note)"
                  class="status-select"
                  :style="{ backgroundColor: getStatusColor(note.status) }"
                >
                  <option value="todo">待完成</option>
                  <option value="done">已完成</option>
                  <option value="remove">已删除</option>
                </select>
              </span>
            </div>
          </transition-group>
          <div class="list-note" :style="{ backgroundColor: listBgColor }">
            <span class="footer" :style="{ color: textColor }">合计：{{ totalItems }}项</span>
            <span v-if="showSearch && $store.state.preferences.enable_search" class="search" :style="{ color: textColor }">搜索：
              <input
                type="text"
                v-model="searchText"
                @keyup.enter="applySearch"
                placeholder="按下回车开始查找……"
                class="search-input"
              />
            </span>
            <span
              v-if="showNewTask"
              class="add-task"
              :style="{ color: textColor }"
              @click="createNewTask"
            >
              +新建任务
            </span>
            <span v-if="showRemoveAll" class="add-task" :style="{ color: textColor }" @click="removeAllTask">-清空任务</span>
          </div>
        </div>

        <div v-else class="card-views">
          <transition-group name="task" tag="div" class="card-grid">
            <div
              v-for="(note, index) in filteredNotes"
              :key="note.n_id"
              :style="{ backgroundColor: listBgColor, transitionDelay: (index * 0.05) + 's' }"
              class="card-note"
            >
              <h4 :style="{ color: textColor }">{{ formatDate(note.created_at, 'MMMDD日') }}</h4>
              <span :style="{ color: textColor }">{{ formatDate(note.created_at, 'HH:mm') }}</span>
              <br />
              <input type="text" v-model="note.title" class="card-title-input" :style="{ color: textColor }" /><br />
              <span
                v-for="tagId in note.tags"
                :key="tagId"
                v-if="$store.state.tags.find(t => t.id === tagId).show"
                class="tag-color"
                :style="{ backgroundColor: getTagColor(tagId) }"
              ></span
              ><br />
              <button @click="editNote(note.n_id)" class="edit-button">查看/编辑</button>
              <button
                v-if="showForceDelete"
                @click="removeForce(note)"
                class="force-delete-button"
              >
                彻底删除
              </button>
              <select
                v-model="note.status"
                @click="setPreviousStatus(note)"
                @change="removeList(note)"
                class="status-select"
                :style="{ backgroundColor: getStatusColor(note.status) }"
              >
                <option value="todo">待完成</option>
                <option value="done">已完成</option>
                <option value="remove">已删除</option>
              </select>
              <span class="encrypted" v-if="note.encrypted">
                <img src="../resource/lock.png" alt="加密" class="card-lock-icon" />
              </span>
              <span v-else class="encrypted"></span>
            </div>
          </transition-group>
          <div class="card-note-footer" :style="{ backgroundColor: listBgColor }">
            <span class="footer" :style="{ color: textColor }">合计：{{ totalItems }}项</span>
            <span v-if="showSearch && $store.state.preferences.enable_search" class="search" :style="{ color: textColor }">搜索：
              <input
                type="text"
                v-model="searchText"
                @keyup.enter="applySearch"
                placeholder="按下回车开始查找……"
                class="search-input"
              />
            </span>
            <span
              v-if="showNewTask"
              class="add-task"
              :style="{ color: textColor }"
              @click="createNewTask"
            >
              +新建任务
            </span>
            <span v-if="showRemoveAll" class="add-task" :style="{ color: textColor }" @click="removeAllTask">-清空任务</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);
dayjs.locale('zh-cn');

export default {
  name: 'TaskBoard',
  props: {
    views: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      default: 'all'
    },
    tagId: {
      type: String,
      default: ''
    },
    newTaskStatus: {
      type: String,
      default: 'todo'
    },
    showNewTask: {
      type: Boolean,
      default: true
    },
    showRemoveAll: {
      type: Boolean,
      default: true
    },
    showSearch: {
      type: Boolean,
      default: true
    },
    showForceDelete: {
      type: Boolean,
      default: false
    },
    showEditButton: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      previousStatus: '',
      isInitialLoad: true,
      searchText: '',
      appliedSearchText: ''
    };
  },
  computed: {
    textColor() {
      return this.$store.state.preferences.item_color;
    },
    listBgColor() {
      return this.$store.state.preferences.dark ? '#333333d5' : '#f9f9f9d5';
    },
    transName() {
      // main-fade only runs when there is at least one non-encrypted, non-removed task
      const hasAnimItem = this.filteredNotes.some(note => !note.encrypted && note.status !== 'remove');
      if (!hasAnimItem) {
        return '';
      }
      if (this.status === 'remove') {
        return '';
      }
      if (this.isInitialLoad) {
        return 'main-fade';
      }
      return this.views === 1 ? 'slide-right' : 'slide-left';
    },
    filteredNotes() {
      return this.$store.state.notes
        .filter(note => {
          const byStatus = this.status === 'all' ? note.status !== 'remove' : note.status === this.status;
          if (!byStatus) return false;

          if (this.tagId) {
            return note.tags.includes(this.tagId);
          }

          return true;
        })
        .filter(note => note.title.includes(this.appliedSearchText));
    },
    totalItems() {
      return this.filteredNotes.length;
    }
  },
  methods: {
    formatDate(dateString, format) {
      return dayjs(dateString).format(format);
    },
    getTagColor(tagId) {
      const tag = this.$store.state.tags.find(t => t.id === tagId);
      return tag ? tag.color : '#b5b1b0';
    },
    getStatusColor(status) {
      const colors = {
        todo: '#f4bd4f',
        done: '#5fc153',
        remove: '#b5b1b0'
      };
      return colors[status] || '#b5b1b0';
    },
    setPreviousStatus(note) {
      if (note.status !== 'remove') {
        this.previousStatus = note.status;
      }
    },
    removeList(note) {
      if (note.status === 'remove') {
        if (this.$store.state.preferences.remove_warning) {
          if (!confirm('确定要删除此任务吗？')) {
            note.status = this.previousStatus;
            return;
          }
        }
        this.$store.commit('removeNote', note.n_id);
        this.$store.commit('saveState');
      }
    },
    removeForce(note) {
      if (this.showForceDelete && note.status === 'remove') {
        if (this.$store.state.preferences.remove_warning) {
          if (!confirm('确定要强制删除此任务吗？这一操作不可撤销')) {
            return;
          }
        }
        this.$store.commit('removeForce', note.n_id);
        this.$store.commit('saveState');
      }
    },
    createNewTask() {
      const n_id = Date.now().toString(16) + Math.floor(0x10000 + Math.random() * 0xf0000).toString(16).substring(1);
      const newNote = {
        n_id,
        title: '新建任务',
        content: '',
        encrypted: false,
        tags: this.tagId ? [this.tagId] : [],
        created_at: new Date().toISOString(),
        status: this.newTaskStatus,
        id: Date.now().toString()
      };
      this.$store.commit('addNote', newNote);
      this.$store.commit('saveState');
    },
    removeAllTask() {
      const filters = note => {
        if (this.tagId && !note.tags.includes(this.tagId)) {
          return false;
        }
        if (this.showForceDelete) {
          if (note.status !== 'remove') return false;
        } else if (this.status === 'all') {
          if (note.status === 'remove') return false;
        } else {
          if (note.status !== this.status) return false;
        }
        return note.title.includes(this.appliedSearchText);
      };

      const visibleNotes = this.filteredNotes;
      if (this.$store.state.preferences.remove_warning) {
        const message = this.showForceDelete
          ? `确定要彻底删除回收站的全部${visibleNotes.length}项任务吗？这一操作不可撤销`
          : `确定要删除本页面的全部${visibleNotes.length}项任务吗？`;
        if (!confirm(message)) {
          return;
        }
      }

      if (this.showForceDelete) {
        this.$store.commit('removeAllNotesForce', filters);
      } else {
        this.$store.commit('removeAllNotes', filters);
      }
      this.$store.commit('saveState');
    },
    editNote(noteId) {
      this.$router.push(`/edit/${noteId}`);
    },
    applySearch() {
      this.appliedSearchText = this.searchText;
    }
  },
  watch: {
    '$store.state.preferences.enable_search': {
      handler(newVal) {
        if (!newVal) {
          this.searchText = '';
          this.appliedSearchText = '';
        }
      }
    }
  },
  mounted() {
    this.isInitialLoad = false;
  }
};
</script>
