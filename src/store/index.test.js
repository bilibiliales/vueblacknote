import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotebookStore, validateBackup } from './index'

function installLocalStorage() {
  const storage = new Map()
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(key => storage.get(key) ?? null),
    setItem: vi.fn((key, value) => storage.set(key, String(value))),
    removeItem: vi.fn(key => storage.delete(key)),
    clear: vi.fn(() => storage.clear())
  })
}

describe('notebook store', () => {
  beforeEach(() => {
    installLocalStorage()
    setActivePinia(createPinia())
  })

  it('validates the backup interface', () => {
    expect(() => validateBackup({ preferences: {}, tags: [], notes: [] })).not.toThrow()
    expect(() => validateBackup({ preferences: {}, tags: {} })).toThrow('缺少必要字段: notes')
    expect(() => validateBackup({ preferences: {}, tags: {}, notes: [] })).toThrow('数据格式不正确')
  })

  it('adds, soft-deletes, and force-deletes notes', () => {
    const store = useNotebookStore()
    const note = {
      n_id: 'test-note',
      title: 'Test note',
      content: '',
      encrypted: false,
      tags: [],
      created_at: new Date().toISOString(),
      status: 'todo'
    }

    store.addNote(note)
    expect(store.notes[0].n_id).toBe('test-note')

    store.removeNote('test-note')
    expect(store.notes.find(item => item.n_id === 'test-note').status).toBe('remove')

    store.removeForce('test-note')
    expect(store.notes.some(item => item.n_id === 'test-note')).toBe(false)
  })

  it('imports compatible backup data and persists it', () => {
    const store = useNotebookStore()
    const backup = {
      preferences: { ...store.preferences, dark: true },
      tags: [{ id: 'x', name: '测试', color: '#000000', show: true }],
      notes: []
    }

    store.importBackup(backup)

    expect(store.preferences.dark).toBe(true)
    expect(store.tags).toEqual(backup.tags)
    expect(localStorage.setItem).toHaveBeenCalledWith('blacknote_data', JSON.stringify(backup))
  })
})
