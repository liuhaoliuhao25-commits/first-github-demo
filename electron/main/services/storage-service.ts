import { app } from 'electron'
import fs from 'fs/promises'
import path from 'path'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { logger } from './logger'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

export interface EncryptedData<T> {
  iv: string
  authTag: string
  encryptedData: string
}

export class StorageService {
  private storagePath: string
  private encryptionKey: Buffer

  constructor(encryptionKey: string) {
    // 从输入生成 32 字节的密钥
    this.encryptionKey = this.deriveKey(encryptionKey)
    
    // 存储路径：用户数据目录
    this.storagePath = path.join(app.getPath('userData'), 'encrypted-storage')
    
    logger.info('Storage Service initialized', {
      path: this.storagePath,
      encryption: true,
    })
  }

  /**
   * 从密码派生加密密钥
   */
  private deriveKey(password: string): Buffer {
    // 简单实现：使用密码的 hash
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(password).digest()
  }

  /**
   * 加密数据
   */
  encrypt<T>(data: T): EncryptedData<T> {
    const iv = randomBytes(IV_LENGTH)
    const cipher = createCipheriv(ALGORITHM, this.encryptionKey, iv)
    
    const jsonData = JSON.stringify(data)
    let encrypted = cipher.update(jsonData, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag().toString('hex')
    
    return {
      iv: iv.toString('hex'),
      authTag,
      encryptedData: encrypted,
    }
  }

  /**
   * 解密数据
   */
  decrypt<T>(encrypted: EncryptedData<T>): T {
    const iv = Buffer.from(encrypted.iv, 'hex')
    const authTag = Buffer.from(encrypted.authTag, 'hex')
    const decipher = createDecipheriv(ALGORITHM, this.encryptionKey, iv)
    
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted.encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return JSON.parse(decrypted) as T
  }

  /**
   * 保存数据到文件
   */
  async save<T>(filename: string, data: T): Promise<void> {
    try {
      // 确保目录存在
      await fs.mkdir(this.storagePath, { recursive: true })
      
      const filePath = path.join(this.storagePath, `${filename}.enc`)
      const encrypted = this.encrypt(data)
      
      await fs.writeFile(filePath, JSON.stringify(encrypted), 'utf8')
      
      logger.debug('Data saved', { filename, encrypted: true })
    } catch (error) {
      logger.error('Failed to save encrypted data', { filename, error })
      throw error
    }
  }

  /**
   * 从文件加载数据
   */
  async load<T>(filename: string): Promise<T | null> {
    try {
      const filePath = path.join(this.storagePath, `${filename}.enc`)
      
      try {
        const content = await fs.readFile(filePath, 'utf8')
        const encrypted = JSON.parse(content) as EncryptedData<T>
        const data = this.decrypt(encrypted)
        
        logger.debug('Data loaded', { filename, encrypted: true })
        return data
      } catch (error) {
        // 文件不存在，返回 null
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return null
        }
        throw error
      }
    } catch (error) {
      logger.error('Failed to load encrypted data', { filename, error })
      throw error
    }
  }

  /**
   * 删除文件
   */
  async delete(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.storagePath, `${filename}.enc`)
      await fs.unlink(filePath)
      
      logger.debug('Data deleted', { filename })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.error('Failed to delete data', { filename, error })
        throw error
      }
    }
  }

  /**
   * 检查文件是否存在
   */
  async exists(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.storagePath, `${filename}.enc`)
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * 列出所有存储文件
   */
  async listFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.storagePath)
      return files
        .filter((f) => f.endsWith('.enc'))
        .map((f) => f.replace('.enc', ''))
    } catch (error) {
      logger.error('Failed to list files', { error })
      return []
    }
  }

  /**
   * 清除所有存储数据
   */
  async clearAll(): Promise<void> {
    try {
      await fs.rm(this.storagePath, { recursive: true, force: true })
      logger.info('All storage cleared')
    } catch (error) {
      logger.error('Failed to clear storage', { error })
      throw error
    }
  }
}
