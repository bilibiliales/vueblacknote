import { describe, expect, it } from 'vitest'
import {
  decodePlainContent,
  decryptNoteContent,
  encodePlainContent,
  encryptNoteContent,
  passwordToKey
} from './noteCrypto'

describe('note crypto helpers', () => {
  it('round-trips unencrypted note content', () => {
    const encoded = encodePlainContent('你好，Vue 3')

    expect(decodePlainContent(encoded)).toBe('你好，Vue 3')
  })

  it('round-trips encrypted note content with a password-derived key', () => {
    const key = passwordToKey('correct horse battery staple')
    const encrypted = encryptNoteContent('secret markdown', key)

    expect(decryptNoteContent(encrypted, 'correct horse battery staple')).toEqual({
      key,
      content: 'secret markdown'
    })
  })

  it('rejects an incorrect password', () => {
    const encrypted = encryptNoteContent('secret markdown', passwordToKey('right'))

    expect(() => decryptNoteContent(encrypted, 'wrong')).toThrow('解密失败')
  })
})
