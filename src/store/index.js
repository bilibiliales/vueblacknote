import Vue from 'vue';
import Vuex from 'vuex';
import supabase, { getCurrentUser } from '@/utils/supabase'

Vue.use(Vuex);

//获取本地保存的state数据
const state_key = "blacknote_data";
const savedState = localStorage.getItem(state_key);
const initState = savedState ? JSON.parse(savedState) : null;

//全局变量和函数
const store =new Vuex.Store({
  state: initState || {
    //偏好参数
    // internal flag to prevent echoing remote changes back to supabase
    __suppress_sync: false,
    preferences: {
      dark: false,
      item_color: "#0078D7",
      default_view: 1,
      homepage: 'MainView',
      background: "",
      background_url: "",
      remove_warning: true,
      remove_force: false,
      enable_markdown: true,
      enable_search: true,
      pause_save_state: false,
    },
    //标签参数
    tags: [
      { id: '1', name: '红色', color: '#ed695f', show: true },
      { id: '2', name: '橙色', color: '#f4bd4f', show: true },
      { id: '3', name: '黄色', color: '#fbe06d', show: true },
      { id: '4', name: '绿色', color: '#5fc153', show: true },
      { id: '5', name: '蓝色', color: '#53a5fc', show: true },
      { id: '6', name: '紫色', color: '#da81ff', show: true },
      { id: '7', name: '个人', color: '#b5b1b0', show: false },
      { id: '8', name: '工作', color: '#b5b1b0', show: false },
      { id: '9', name: '学习', color: '#b5b1b0', show: false }
    ],
    //任务参数
    notes: [
      {
        n_id: "195e2aba619751b",
        title: "失眠飞行",
        content: "U2FsdGVkX19vatpAzs2wNhrOwihqqOoBi5vmDtAcRrzKul8lz5cVuJtwYXethLlBpJo7BWgrbrOjYZMasMiUeDZ6kYz82WPl5gdlXEK6zrerSahPWaThgXBKw6JtEWbINbx2FP2tkhgvMVb7PUPtqbp6HWAkK0sC/6DGttXjlTAqawq/4KR3v+U3vFpJT0U3EMRuXigK8iDhSfZk6jviGwa23831qQdRGI4DYZEhpTcxqFp4+oVX1ZL9G96s/OHic0BdEXN9zb1UzEVBDTFydgaLZl94ck353a1MAj8nfIR3YMd8GtY2up87O7yIykW57eCEViCd+vG6y/rK5MAOte4iwv26jfJFmEY5KzW9r8vUdLl/WAXYd4/XDCrGoetS47N4xHlkNp4yCrDDGtKXN4evvBIahJeaWO96mSdBsJdKkTOJ5zz+ZvT3vu56Be1hIPObkGCFbMObXUtWezPB1RuLoEhxBKZBQcqrwKeAFwo99Z72RLK0Rc/KSTjTjqupwlDeR5PR9pACcMG5H+WwBuoojt783j93839bGsfa5awe41HkkF83rZCbSSEgiPAnN0Z9DiaNOAVUa2vlBog1HfbsY6d3jPSh7uVAvFoQd08IwVS3xUc2JxK1RQHN6bPyY5nGb4eY4odj64JH3RA3dWoxZHWBEWbKYy2mHHrWCZY=",
        encrypted: true,
        tags: ["1"],
        created_at: "2025-03-27T14:55:00Z",
        updated_at: "2025-03-27T15:10:00Z",
        status: "done"
      },
      {
        n_id: "195e2ab2b73cf3e",
        title: "包含了所有的标签",
        content: "QkxBQ0tOT1RFQOi/meaYr+S4gOS4quWMheWQq+S6huaJgOacieagh+etvueahOS7u+WKoeWGheWuueaWh+acrOOAgg==",
        encrypted: false,
        tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
        created_at: "2025-03-26T14:35:00Z",
        updated_at: "2025-03-26T15:10:00Z",
        status: "todo"
      },
      {
        n_id: "195e2ac1596af85",
        title: "删除任务示例",
        content: "QkxBQ0tOT1RFQOaIkeaDs+WSjOS9oCDkuIDotbfpl6/ov5vmo67mnpfmvZzlhaXmtbflupU=",
        encrypted: false,
        tags: ["1", "2"],
        created_at: "2025-03-25T14:35:00Z",
        updated_at: "2025-03-27T15:10:00Z",
        status: "remove"
      }
    ]
  },
  mutations: {
    addNote(state, note) {
      //从头插入
      state.notes.unshift({
        ...note,
        updated_at: new Date().toISOString()
      });
    },
    removeNote(state, noteId) {
      if (state.preferences.remove_force) {
        state.notes = state.notes.filter(note => note.n_id !== noteId)
      } else {
        const index = state.notes.findIndex(note => note.n_id === noteId)
        if (index > -1) state.notes[index].status = 'remove'
      }
    },
    removeForce(state, noteId) {
      state.notes = state.notes.filter(note => note.n_id !== noteId)
    },
    removeAllNotes(state, filters) {
      if (state.preferences.remove_force) {
        state.notes = state.notes.filter(note => !filters(note))
      } else {
        state.notes = state.notes.map(note =>
          filters(note) ? { ...note, status: 'remove' } : note
        )
      }
    },
    removeAllNotesForce(state, filters) {
      state.notes = state.notes.filter(note => !filters(note))
    },
    updateNote(state, updatedNote) {
      const index = state.notes.findIndex(n => n.n_id === updatedNote.n_id)
      if (index !== -1) {
        state.notes.splice(index, 1, updatedNote)
      }
    },
    //设置本地保存的state数据
    saveState(state) {
      if(state.preferences.pause_save_state){
        return;//取消自动保存
      }
      // write local copy
      const payloadObj = {
        preferences: state.preferences,
        tags: state.tags,
        notes: state.notes
      }
      localStorage.setItem(state_key, JSON.stringify(payloadObj));

      // if this save was triggered by applying a remote update, skip pushing back to Supabase
      if (state.__suppress_sync) {
        // reset flag and do not push
        state.__suppress_sync = false
        return
      }

      // 非阻塞地将备份推送到 Supabase（包含 update_at）
      try {
        const user = getCurrentUser()
        if (user) {
          const localData = JSON.stringify(payloadObj)
          const payloadData = JSON.stringify({ update_at: new Date().toISOString(), data: localData })
          supabase.from('backups').upsert({ user_id: user.id, data: payloadData }, { onConflict: 'user_id' })
            .then(({ error }) => { if (error) console.warn('supabase backup upsert failed', error) })
            .catch(e => console.warn('supabase backup upsert exception', e))
        }
      } catch (e) {
        console.warn('saveState supabase sync failed', e)
      }
    },
    // apply a remote backup payload (parsed JSON object) to memory and localStorage without echoing
    applyRemoteBackup(state, parsed) {
      try {
        state.__suppress_sync = true
        if (parsed.preferences) state.preferences = parsed.preferences
        if (Array.isArray(parsed.tags)) state.tags = parsed.tags
        if (Array.isArray(parsed.notes)) state.notes = parsed.notes
        // persist locally
        const payloadObj = { preferences: state.preferences, tags: state.tags, notes: state.notes }
        localStorage.setItem(state_key, JSON.stringify(payloadObj))
      } finally {
        state.__suppress_sync = false
      }
    }
  }
})
export default store;
