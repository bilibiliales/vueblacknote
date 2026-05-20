import { defineStore } from 'pinia'
import supabase, { getCurrentUser } from '@/utils/supabase'

export const stateKey = 'blacknote_data'

export function createDefaultState() {
  return {
    __suppress_sync: false,
    preferences: {
      dark: false,
      item_color: '#0078D7',
      default_view: 1,
      homepage: 'MainView',
      background: '',
      background_url: '',
      remove_warning: true,
      remove_force: false,
      enable_markdown: true,
      enable_search: true,
      pause_save_state: false
    },
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
    notes: [
      {
        n_id: '195e2aba619751b',
        title: '失眠飞行',
        content: 'U2FsdGVkX19vatpAzs2wNhrOwihqqOoBi5vmDtAcRrzKul8lz5cVuJtwYXethLlBpJo7BWgrbrOjYZMasMiUeDZ6kYz82WPl5gdlXEK6zrerSahPWaThgXBKw6JtEWbINbx2FP2tkhgvMVb7PUPtqbp6HWAkK0sC/6DGttXjlTAqawq/4KR3v+U3vFpJT0U3EMRuXigK8iDhSfZk6jviGwa23831qQdRGI4DYZEhpTcxqFp4+oVX1ZL9G96s/OHic0BdEXN9zb1UzEVBDTFydgaLZl94ck353a1MAj8nfIR3YMd8GtY2up87O7yIykW57eCEViCd+vG6y/rK5MAOte4iwv26jfJFmEY5KzW9r8vUdLl/WAXYd4/XDCrGoetS47N4xHlkNp4yCrDDGtKXN4evvBIahJeaWO96mSdBsJdKkTOJ5zz+ZvT3vu56Be1hIPObkGCFbMObXUtWezPB1RuLoEhxBKZBQcqrwKeAFwo99Z72RLK0Rc/KSTjTjqupwlDeR5PR9pACcMG5H+WwBuoojt783j93839bGsfa5awe41HkkF83rZCbSSEgiPAnN0Z9DiaNOAVUa2vlBog1HfbsY6d3jPSh7uVAvFoQd08IwVS3xUc2JxK1RQHN6bPyY5nGb4eY4odj64JH3RA3dWoxZHWBEWbKYy2mHHrWCZY=',
        encrypted: true,
        tags: ['1'],
        created_at: '2025-03-27T14:55:00Z',
        updated_at: '2025-03-27T15:10:00Z',
        status: 'done'
      },
      {
        n_id: '195e2ab2b73cf3e',
        title: '包含了所有标签的示例任务',
        content: 'QkxBQ0tOT1RFQOi/meaYr+S4gOS4quWMheWQq+S6huaJgOacieagh+etvueahOS7u+WKoeWGheWuueaWh+acrOOAgg==',
        encrypted: false,
        tags: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        created_at: '2025-03-26T14:35:00Z',
        updated_at: '2025-03-26T15:10:00Z',
        status: 'todo'
      },
      {
        n_id: '195e2ac1596af85',
        title: '删除任务示例',
        content: 'QkxBQ0tOT1RFQOaIkeaDs+WSjOS9oCDkuIDotbfpl6/ov5vmo67mnpfmvZzlhaXmtbflupU=',
        encrypted: false,
        tags: ['1', '2'],
        created_at: '2025-03-25T14:35:00Z',
        updated_at: '2025-03-27T15:10:00Z',
        status: 'remove'
      }
    ]
  }
}

function loadState() {
  const fallback = createDefaultState()
  try {
    const savedState = localStorage.getItem(stateKey)
    if (!savedState) return fallback
    const parsed = JSON.parse(savedState)
    return {
      ...fallback,
      ...parsed,
      __suppress_sync: false,
      preferences: { ...fallback.preferences, ...(parsed.preferences || {}) },
      tags: Array.isArray(parsed.tags) ? parsed.tags : fallback.tags,
      notes: Array.isArray(parsed.notes) ? parsed.notes : fallback.notes
    }
  } catch (error) {
    console.warn('读取本地数据失败，已使用默认数据', error)
    return fallback
  }
}

export function validateBackup(data) {
  if (!data || typeof data !== 'object') throw new Error('无效的备份文件')
  const requiredKeys = ['preferences', 'tags', 'notes']
  requiredKeys.forEach(key => {
    if (!(key in data)) throw new Error(`缺少必要字段: ${key}`)
  })
  if (!Array.isArray(data.tags) || !Array.isArray(data.notes)) {
    throw new Error('数据格式不正确')
  }
}

export const useNotebookStore = defineStore('notebook', {
  state: loadState,
  actions: {
    backupPayload() {
      return {
        preferences: this.preferences,
        tags: this.tags,
        notes: this.notes
      }
    },
    addNote(note) {
      this.notes.unshift({
        ...note,
        updated_at: new Date().toISOString()
      })
    },
    removeNote(noteId) {
      if (this.preferences.remove_force) {
        this.notes = this.notes.filter(note => note.n_id !== noteId)
      } else {
        const index = this.notes.findIndex(note => note.n_id === noteId)
        if (index > -1) this.notes[index].status = 'remove'
      }
    },
    removeForce(noteId) {
      this.notes = this.notes.filter(note => note.n_id !== noteId)
    },
    removeAllNotes(filters) {
      if (this.preferences.remove_force) {
        this.notes = this.notes.filter(note => !filters(note))
      } else {
        this.notes = this.notes.map(note =>
          filters(note) ? { ...note, status: 'remove' } : note
        )
      }
    },
    removeAllNotesForce(filters) {
      this.notes = this.notes.filter(note => !filters(note))
    },
    updateNote(updatedNote) {
      const index = this.notes.findIndex(note => note.n_id === updatedNote.n_id)
      if (index !== -1) {
        this.notes.splice(index, 1, updatedNote)
      }
    },
    async saveState(payload) {
      if (this.preferences.pause_save_state && !(payload && payload.force)) {
        return
      }

      const payloadObj = this.backupPayload()
      localStorage.setItem(stateKey, JSON.stringify(payloadObj))

      if (this.__suppress_sync) {
        this.__suppress_sync = false
        return
      }

      try {
        const user = getCurrentUser()
        if (user) {
          const payloadData = JSON.stringify({
            update_at: new Date().toISOString(),
            data: JSON.stringify(payloadObj)
          })
          const { error } = await supabase
            .from('backups')
            .upsert({ user_id: user.id, data: payloadData }, { onConflict: 'user_id' })
          if (error) console.warn('supabase backup upsert failed', error)
        }
      } catch (error) {
        console.warn('saveState supabase sync failed', error)
      }
    },
    applyRemoteBackup(parsed) {
      validateBackup(parsed)
      this.__suppress_sync = true
      this.preferences = { ...this.preferences, ...parsed.preferences }
      this.tags = parsed.tags
      this.notes = parsed.notes
      localStorage.setItem(stateKey, JSON.stringify(this.backupPayload()))
      this.__suppress_sync = false
    },
    importBackup(parsed) {
      validateBackup(parsed)
      this.preferences = { ...this.preferences, ...parsed.preferences }
      this.tags = parsed.tags
      this.notes = parsed.notes
      localStorage.setItem(stateKey, JSON.stringify(this.backupPayload()))
    }
  }
})
