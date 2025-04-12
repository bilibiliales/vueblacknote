<!-- 待完成（除已删除外的全部任务） -->
<template>
  <div>
    <!--动态变换动画-->
    <transition :name="transName" mode="out-in" appear>
      <!--列表视图-->
  <div v-if="views===1" key="list" class="list-views">
    <div v-for="note in $store.state.notes.filter(note => note.status == 'todo')" :key="note.n_id" :style="{ backgroundColor: listBgColor }" class="list-note">
      <span class="list-left">
        <h4 :style="{ color: textColor }">{{ formatDate(note.created_at, 'DD') }}</h4>
        <span :style="{ color: textColor }">{{ formatDate(note.created_at, 'MMM') }}</span>
      </span>
      <span class="list-middle">
        <span :style="{ color: textColor }" class="time">{{ formatDate(note.created_at, 'HH:mm') }}</span>
        <input type="text" v-model="note.title" class="title-input" :style="{ color: textColor }" @change="$store.commit('saveState')">
        <span v-for="tagId in note.tags" :key="tagId" v-if="$store.state.tags.find(t => t.id === tagId).show" class="tag-color"
          :style="{ backgroundColor: getTagColor(tagId) }"></span>
      </span>
      <span class="list-right">
        <span class="encrypted" v-if="note.encrypted">
          <img src="../resource/lock.png" alt="加密" class="lock-icon">
        </span>
        <span v-else class="encrypted"></span>
        <button @click="editNote(note.n_id)" class="edit-button">查看/编辑</button>
        <select v-model="note.status" @click="setPreviousStatus(note)" @change="removeList(note)" class="status-select" :style="{ backgroundColor: getStatusColor(note.status) }">
          <option value="todo">待完成</option>
          <option value="done">已完成</option>
          <option value="remove">已删除</option>
        </select>
      </span>
    </div>
    <!--新建任务-->
    <div class="list-note" :style="{ backgroundColor: listBgColor }">
      <span class="footer" :style="{ color: textColor }">合计：{{ totalItems }}项</span>
      <span class="add-task" :style="{ color: textColor } " @click="createNewTask">+新建任务</span>
      <span class="add-task" :style="{ color: textColor } " @click="removeAllTask">-清空任务</span>
    </div>
  </div>

  <!--卡片视图-->
  <div v-else key="card" class="card-views">
    <div v-for="note in $store.state.notes.filter(note => note.status == 'todo')" :key="note.n_id" :style="{ backgroundColor: listBgColor }" class="card-note">
      <h4 :style="{ color: textColor }">{{ formatDate(note.created_at, 'MMMDD日') }}</h4>
      <span :style="{ color: textColor }">{{ formatDate(note.created_at, 'HH:mm') }}</span>
      <br/>
        <input type="text" v-model="note.title" class="card-title-input" :style="{ color: textColor }"><br/>
        <span v-for="tagId in note.tags" :key="tagId" v-if="$store.state.tags.find(t => t.id === tagId).show" class="tag-color"
          :style="{ backgroundColor: getTagColor(tagId) }"></span><br/>
        <button @click="editNote(note.n_id)" class="edit-button">查看/编辑</button>
        <select v-model="note.status" @click="setPreviousStatus(note)" @change="removeList(note)" class="status-select" :style="{ backgroundColor: getStatusColor(note.status) }">
          <option value="todo">待完成</option>
          <option value="done">已完成</option>
          <option value="remove">已删除</option>
        </select>
        <span class="encrypted" v-if="note.encrypted">
          <img src="../resource/lock.png" alt="加密" class="card-lock-icon">
        </span>
        <span v-else class="encrypted"></span>
    </div>
    <!--不需要改底部-->
    <div class="card-note-footer" :style="{ backgroundColor: listBgColor }">
      <span class="footer" :style="{ color: textColor }">合计：{{ totalItems }}项</span>
      <span class="add-task" :style="{ color: textColor } " @click="createNewTask">+新建任务</span>
      <span class="add-task" :style="{ color: textColor } " @click="removeAllTask">-清空任务</span>
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
  name: 'MainView',
  props: {
    views: Number
  },
  data() {
    return {
      // 运行时参数
      removed: "remove",
      previousStatus: "",
      isInitialLoad: true,
    };
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
        todo: '#f4bd4fee',
        done: '#5fc153ee',
        remove: '#b5b1b0ee'
      };
      return colors[status];
    },
    setPreviousStatus(note) {
      if (note.status != 'remove'){
        this.previousStatus=note.status;
      }
    },
    removeList(note) {
      if (note.status === 'remove') {
        if(this.$store.state.preferences.remove_warning){
          if (!confirm('确定要删除此任务吗？')){
            note.status = this.previousStatus;
          }
          else{
            this.$store.commit('removeNote', note.n_id);
            this.$store.commit('saveState');
          }
        }else{
          this.$store.commit('removeNote', note.n_id);
          this.$store.commit('saveState');
        }
      }
    },
    createNewTask() {
      const n_id=Date.now().toString(16) + Math.floor(0x10000 + Math.random() * 0xf0000).toString(16).substring(1);
      const newNote = {
        n_id: n_id,
        title: '新建任务',
        content: '',
        encrypted: false,
        tags: [],
        created_at: new Date().toISOString(),
        status: 'todo',
        id: Date.now().toString()
      };
      this.$store.commit('addNote', newNote);
      this.$store.commit('saveState');
    },
    removeAllTask() {
      //当前所有页面
      const filters = note => note.status == 'todo';
      const visibleNotes = this.$store.state.notes.filter(filters);
      if (this.$store.state.preferences.remove_warning) {
        if (confirm(`确定要删除本页面的全部${visibleNotes.length}项任务吗？`)) {
          this.$store.commit('removeAllNotes', filters);
          this.$store.commit('saveState');
        }
      } else {
        this.$store.commit('removeAllNotes', filters);
        this.$store.commit('saveState');
      }
    },
    editNote(noteId) {
      this.$router.push(`/edit/${noteId}`)
    },
  },
  computed: {
    totalItems() {
      return this.$store.state.notes.filter(note => note.status == 'todo').length;
    },
    textColor() {
      return this.$store.state.preferences.item_color;
    },
    listBgColor() {
      return this.$store.state.preferences.dark ? '#333333d5' : '#f9f9f9d5';
    },
    transName() {
      return this.isInitialLoad ? 'main-fade' : 
             this.views === 1 ? 'slide-right' : 'slide-left';
    },
  },
  mounted() {
    this.isInitialLoad = false;
  }
}
</script>

<style scoped>

.list-views {
  padding: 20px;
}

.list-note {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.1);
  translate: all 0.3s;
}

.list-left {
  text-align: center;
  width: 100px;
}

.list-left h4 {
  margin: 0;
  font-size: 32px;
}

.list-left span {
  display: block;
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
}

.list-middle {
  flex: 1;
  padding: 0 20px;
}



.card-views {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 20px;
}

.card-note {
  display: block;
  text-align: center;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.1);
  translate: all 0.3s;
  flex: 1 0 calc(33.333% - 20px);
  box-sizing: border-box;
}

.card-note h4 {
  margin: 0;
  font-size: 20px;
}

.card-note-footer {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.1);
  translate: all 0.3s;
}


.time {
  display: block;
  font-size: 14px;
  margin-bottom: 4px;
}

.tag-color {
  display: inline-block;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  margin-right: 5px;
  margin-bottom: 5px;
}

.title-input {
  border: none;
  background: transparent;
  font-size: 20px;
  font-weight: bold;
  outline: none;
  width: 30%;
  margin-bottom: 10px;
}

.card-title-input {
  border: none;
  background: transparent;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  outline: none;
  width: 86%;
  margin-bottom: 10px;
}

.list-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.encrypted {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
}

.lock-icon {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

.card-lock-icon {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

.edit-button {
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

.edit-button:hover {
  background-color: #005aa4;
}

.status-select {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  color: white;
  cursor: pointer;
  appearance: none;
  min-width: 80px;
}

.footer {
  text-align: center;
  padding: 4px;
  color: #b5b5b5;
  font-size: 16px;
}

.add-task {
  text-align: center;
  cursor: pointer;
  padding: 8px 20px;
  border-radius: 8px;
  color: #b5b5b5;
  font-size: 16px;
  transition: all 0.3s;
}

.add-task:hover {
  background: rgba(128,128,128,0.1);
}
.main-fade-enter-active {
    transition: all 0.8s cubic-bezier(0.2, 0.8, 0.4, 1);
  }
  .main-fade-enter {
    opacity: 0;
    transform: translateY(-30px);
  }
  .main-fade-enter-to {
    opacity: 1;
    transform: translateY(0px);
  }
  .slide-left-enter-active,
  .slide-right-enter-active,
  .slide-left-leave-active,
  .slide-right-leave-active {
    transition: all 0.4s cubic-bezier(0.2, 0.8, 0.4, 1);
  }
  
  .slide-left-enter {
    opacity: 0;
    transform: translateX(20px);
  }
  .slide-left-leave-to {
    opacity: 0;
    transform: translateX(-20px);
  }
  
  .slide-right-enter {
    opacity: 0;
    transform: translateX(-20px);
  }
  .slide-right-leave-to {
    opacity: 0;
    transform: translateX(20px);
  }
</style>