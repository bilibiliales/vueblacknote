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
      remove_warning: true,
      remove_force: false,
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
        n_id: "195e2ab2b73cf3e",
        title: "包含了所有的标签", 
        content: "QkxBQ0tOT1RFQOi/meaYr+S4gOS4quWMheWQq+S6huaJgOacieagh+etvueahOS7u+WKoeWGheWuueaWh+acrOOAgg==",
        encrypted: false,
        tags: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
        created_at: "2025-03-27T14:35:00Z",
        updated_at: "2025-03-27T15:10:00Z",
        status: "todo"
      },
      {  
        n_id: "195e2aba619751b",
        title: "失眠飞行—沈以诚/薛黛霏", 
        content: "U2FsdGVkX1/CVEP8feQNKd09ybbve3dIOIrBktWmf4XX9zlma7N3pjSe0d2Jt1KNbmCGvGzky8DRo1uhUI/2DkY0GGcUGzLfz9WhlgAwIf0rk+JhUlznxsEdKpCJ377e",
        encrypted: true,
        tags: ["1"],
        created_at: "2025-03-26T14:55:00Z",
        updated_at: "2025-03-27T15:10:00Z",
        status: "done"
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
      localStorage.setItem(state_key, JSON.stringify({
        preferences: state.preferences,
        tags: state.tags,
        notes: state.notes
      }));
    }
  }
})
export default store;