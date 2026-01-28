import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync, renameSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

class Database {
  constructor(userPath, productPath) {
    // Default to config globals if not provided (fallback)
    this.userPath = userPath || global.dbPathUser
    this.productPath = productPath || global.dbPathProduct
    
    this.userDb = null
    this.prodDb = null
  }

  async init() {
    // 1. Ensure database directories exist
    const userDir = dirname(this.userPath)
    if (!existsSync(userDir)) mkdirSync(userDir, { recursive: true })
    
    const prodDir = dirname(this.productPath)
    if (!existsSync(prodDir)) mkdirSync(prodDir, { recursive: true })

    // 2. Initialize adapters
    this.userDb = new Low(new JSONFile(this.userPath), {})
    this.prodDb = new Low(new JSONFile(this.productPath), {})
    
    await this.userDb.read()
    await this.prodDb.read()
    
    // 3. Initialize default data structure
    if (!this.userDb.data) this.userDb.data = {}
    if (!this.prodDb.data) this.prodDb.data = {}
    
    // Users Defaults
    if (!this.userDb.data.users) this.userDb.data.users = {}
    if (!this.userDb.data.owners) this.userDb.data.owners = []
    if (!this.userDb.data.redeemCodes) this.userDb.data.redeemCodes = {}
    if (!this.userDb.data.stats) this.userDb.data.stats = { totalOrders: 0 }

    // Products Defaults
    if (!this.prodDb.data.products) this.prodDb.data.products = {}

    // 4. MIGRATION LOGIC (Legacy db.json -> New Split Files)
    const legacyPath = './database/db.json'
    const isNewUserDb = Object.keys(this.userDb.data.users).length === 0
    
    if (isNewUserDb && existsSync(legacyPath)) {
        console.log('🔄 [MIGRATION] Detected legacy database. Starting migration from db.json...')
        
        try {
            const legacyDb = new Low(new JSONFile(legacyPath), {})
            await legacyDb.read()
            
            if (legacyDb.data) {
                // Populate User DB
                if (legacyDb.data.users) this.userDb.data.users = legacyDb.data.users
                if (legacyDb.data.owners) this.userDb.data.owners = legacyDb.data.owners
                if (legacyDb.data.stats) this.userDb.data.stats = legacyDb.data.stats
                if (legacyDb.data.redeemCodes) this.userDb.data.redeemCodes = legacyDb.data.redeemCodes
                
                // Populate Product DB
                // Check if old structure had products
                if (legacyDb.data.products) {
                    this.prodDb.data.products = legacyDb.data.products
                    console.log(`📦 [MIGRATION] Moved ${Object.keys(legacyDb.data.products).length} products.`)
                }
                
                // Save both
                await this.write()
                
                console.log('✅ [MIGRATION] Success! Database separated into users.json and products.json')
                
                // Rename legacy file to backup
                const backupName = `${legacyPath}.backup-${Date.now()}`
                renameSync(legacyPath, backupName)
                console.log(`🗑️ [MIGRATION] Legacy db renamed to ${backupName}`)
            }
        } catch (err) {
            console.error('❌ [MIGRATION] Failed:', err)
        }
    }
    
    await this.write()
    return this
  }

  // Unified write method (Saves BOTH)
  async write() {
      await Promise.all([
          this.userDb.write(),
          this.prodDb.write()
      ])
  }

  // Legacy getter for backward compatibility (if something tries to access db.data directly)
  // This is risky, but useful for debugging. Returns merged view (read-only mostly)
  get data() {
      return {
          ...this.userDb.data,
          ...this.prodDb.data
      }
  }

  // Stats methods (User DB)
  async addSuccessfulOrder() {
    if (!this.userDb.data.stats) this.userDb.data.stats = { totalOrders: 0 }
    this.userDb.data.stats.totalOrders += 1
    await this.userDb.write()
  }

  getStats() {
    return {
      totalUsers: Object.keys(this.userDb.data.users).length,
      totalOrders: this.userDb.data.stats?.totalOrders || 0,
      totalProducts: Object.keys(this.prodDb.data.products).length // From Product DB
    }
  }

  // User methods (User DB)
  getUser(telegramId) {
    return this.userDb.data.users[telegramId] || null
  }

  async createUser(telegramId, username) {
    if (!this.userDb.data.users[telegramId]) {
      this.userDb.data.users[telegramId] = {
        username: username || 'Unknown',
        role: this.isOwner(telegramId) ? 'owner' : 'guest',
        saldo: 0,
        createdAt: Date.now()
      }
      await this.userDb.write()
    }
    return this.userDb.data.users[telegramId]
  }

  async updateSaldo(telegramId, amount) {
    if (!this.userDb.data.users[telegramId]) {
      await this.createUser(telegramId)
    }
    this.userDb.data.users[telegramId].saldo += amount
    await this.userDb.write()
    return this.userDb.data.users[telegramId].saldo
  }

  // Product methods (Product DB)
  async addProduct(data) {
    const id = Date.now().toString()
    
    // Explicitly construct valid media object if exists
    let mediaData = null
    if (data.media && data.media.url) {
        mediaData = {
            type: data.media.type || 'image', // Default to image if type missing
            url: data.media.url
        }
    }

    // Simpan data produk dengan struktur yang pasti
    this.prodDb.data.products[id] = {
      id,
      nama: data.nama,
      harga: data.harga,
      deskripsi: data.deskripsi || '',
      stock: data.stock || 0,
      media: mediaData, // Gunakan variabel yang sudah divalidasi
      createdAt: Date.now()
    }
    
    await this.prodDb.write()
    return this.prodDb.data.products[id]
  }

  async deleteProduct(id) {
    if (this.prodDb.data.products[id]) {
      delete this.prodDb.data.products[id]
      await this.prodDb.write()
      return true
    }
    return false
  }

  getProducts() {
    return Object.values(this.prodDb.data.products)
  }

  getProduct(id) {
    return this.prodDb.data.products[id] || null
  }

  // Redeem code methods (User DB)
  async createRedeemCode(code, saldo, expired = null) {
    if (this.userDb.data.redeemCodes[code]) {
      throw new Error('Code already exists')
    }
    
    this.userDb.data.redeemCodes[code] = {
      saldo,
      used: false,
      usedBy: null,
      expired: expired ? this.parseExpiry(expired) : null,
      createdAt: Date.now()
    }
    await this.userDb.write()
    return this.userDb.data.redeemCodes[code]
  }

  async useRedeemCode(code, telegramId) {
    const redeemData = this.userDb.data.redeemCodes[code]
    
    if (!redeemData) {
      throw new Error('Code tidak ditemukan')
    }
    
    if (redeemData.used) {
      throw new Error('Code sudah digunakan')
    }
    
    if (redeemData.expired && Date.now() > redeemData.expired) {
      throw new Error('Code sudah expired')
    }
    
    // Mark as used
    redeemData.used = true
    redeemData.usedBy = telegramId
    redeemData.usedAt = Date.now()
    
    // Add saldo to user
    await this.updateSaldo(telegramId, redeemData.saldo)
    await this.userDb.write()
    
    return redeemData.saldo
  }

  async cleanExpiredCodes() {
    const now = Date.now()
    let cleaned = 0
    
    for (const [code, data] of Object.entries(this.userDb.data.redeemCodes)) {
      if (data.expired && now > data.expired && !data.used) {
        delete this.userDb.data.redeemCodes[code]
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      await this.userDb.write()
    }
    
    return cleaned
  }

  parseExpiry(expiry) {
    if (typeof expiry === 'number') return expiry
    
    const units = {
      h: 3600000,      // 1 hour
      d: 86400000,     // 1 day
      w: 604800000     // 1 week
    }
    
    const match = expiry.match(/^(\d+)([hdw])$/)
    if (match) {
      const [, amount, unit] = match
      return Date.now() + (parseInt(amount) * units[unit])
    }
    
    return null
  }

  // Owner methods (User DB)
  async addOwner(telegramId) {
    if (!this.userDb.data.owners.includes(telegramId)) {
      this.userDb.data.owners.push(telegramId)
      
      // Update user role if exists
      if (this.userDb.data.users[telegramId]) {
        this.userDb.data.users[telegramId].role = 'owner'
      }
      
      await this.userDb.write()
      return true
    }
    return false
  }

  async removeOwner(telegramId) {
    const index = this.userDb.data.owners.indexOf(telegramId)
    if (index > -1) {
      this.userDb.data.owners.splice(index, 1)
      
      // Update user role if exists
      if (this.userDb.data.users[telegramId]) {
        this.userDb.data.users[telegramId].role = 'guest'
      }
      
      await this.userDb.write()
      return true
    }
    return false
  }

  isOwner(telegramId) {
    return this.userDb.data.owners.includes(telegramId)
  }

  getOwners() {
    return this.userDb.data.owners
  }

  // Backup (Depreciated method kept for API compatibility if needed)
  // But now returns merged string
  async backup() {
    return JSON.stringify({
        ...this.userDb.data,
        ...this.prodDb.data
    }, null, 2)
  }
}

export default Database
