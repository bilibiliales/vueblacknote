import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

//获取本地保存的state数据
const state_key = "blacknote_data";
const savedState = localStorage.getItem(state_key);
const initState = savedState ? JSON.parse(savedState) : null;

//全局变量和函数
const store =new Vuex.Store({
  state: initState || {
    //偏好参数
    preferences: {
      dark: false,
      item_color: "#0078D7",
      default_view: 1,
      homepage: 'MainView',
      background_img: 5,
      background: "",
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
        content: "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",
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
    setBackgroundImg(state, payload) {
      state.preferences.background_img = payload
    },
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
      if(pause_save_state){
        return;//取消自动保存
      }
      localStorage.setItem(state_key, JSON.stringify({
        preferences: state.preferences,
        tags: state.tags,
        notes: state.notes
      }));
    }
  }
})
export default store;