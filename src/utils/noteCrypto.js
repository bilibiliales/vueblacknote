import CryptoJS from 'crypto-js'

export const noteSalt = 'BLACKNOTE@'

export function decodeBase64(content) {
  try {
    return CryptoJS.enc.Base64.parse(content).toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('解码失败:', error)
    return content
  }
}

export function encodePlainContent(content) {
  return CryptoJS.enc.Base64.stringify(
    CryptoJS.enc.Utf8.parse(`${noteSalt}${content}`)
  )
}

export function passwordToKey(password) {
  return CryptoJS.SHA256(password).toString()
}

export function decryptNoteContent(encryptedContent, password) {
  try {
    const key = passwordToKey(password)
    const bytes = CryptoJS.AES.decrypt(encryptedContent, key)
    const base64Content = bytes.toString(CryptoJS.enc.Utf8)
    if (!base64Content) throw new Error('解密失败')

    const saltedContent = decodeBase64(base64Content)
    if (!saltedContent.startsWith(noteSalt)) {
      throw new Error('数据损坏')
    }

    return {
      key,
      content: saltedContent.slice(noteSalt.length)
    }
  } catch (error) {
    if (error.message === '数据损坏') throw error
    throw new Error('解密失败')
  }
}

export function encryptNoteContent(content, key) {
  return CryptoJS.AES.encrypt(encodePlainContent(content), key).toString()
}

export function decodePlainContent(content) {
  const saltedContent = decodeBase64(content)
  return saltedContent.startsWith(noteSalt)
    ? saltedContent.slice(noteSalt.length)
    : saltedContent
}
