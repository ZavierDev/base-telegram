import { scheduleJob } from 'node-schedule'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execPromise = promisify(exec)

class BackupScheduler {
  constructor(bot, db) {
    this.bot = bot
    this.db = db
    this.job = null
  }

  start() {
    // Schedule backup setiap jam 12 malam (00:00) DAN jam 12 siang (12:00)
    this.job = scheduleJob('0 0,12 * * *', async () => {
      console.log('⏰ Triggering Scheduled Auto Backup...')
      await this.performBackup()
    })

    console.log('⏰ Auto backup scheduled: Setiap Jam 12 Siang & Malam (DB ZIP Mode)')
  }

  async performBackup() {
    const date = new Date()
    const timestamp = date.toISOString().replace(/[:.]/g, '-').split('T')
    
    // Nama file backup (ZIP karena sekarang multiple file)
    const zipName = `AutoBackup_DB_${timestamp[0]}_${date.getHours()}-${date.getMinutes()}.zip`
    const zipPath = path.resolve(zipName)

    try {
      // 1. Force Save Database (Unified Write)
      await this.db.write()

      // 2. Zip 'database' folder
      // Command: tar -a -c -f <zipName> database
      await execPromise(`tar -a -c -f "${zipName}" database`)

      // 3. Get Size
      if (!fs.existsSync(zipPath)) {
          console.error('❌ Failed to create backup zip')
          return
      }

      const stats = fs.statSync(zipPath)
      const fileSize = (stats.size / 1024).toFixed(2) // KB
      
      console.log(`📦 Creating Auto Backup DB: ${zipName} (${fileSize} KB)`)

      // 4. Send backup to all owners
      for (const ownerId of global.owners) {
        try {
          await this.bot.telegram.sendDocument(ownerId, {
            source: zipPath,
            filename: zipName
          }, {
            caption: `
🤖 AUTO BACKUP DATABASE (Split System)
            
📅 Tanggal: ${date.toLocaleDateString('id-ID')}
⏰ Waktu: ${date.toLocaleTimeString('id-ID')}
📦 File: ${zipName}
💾 Size: ${fileSize} KB

Contains:
- users.json (User Data)
- products.json (Product Data)

✅ Otomatis dipisahkan & diamankan!
            `.trim()
          })
          
          console.log(`✅ Auto Backup sent to owner: ${ownerId}`)
        } catch (error) {
          console.error(`❌ Failed to send backup to ${ownerId}:`, error.message)
        }
      }

      // 5. Cleanup
      fs.unlinkSync(zipPath)

    } catch (error) {
      console.error('❌ Auto backup failed:', error)
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)
    }
  }

  stop() {
    if (this.job) {
      this.job.cancel()
      console.log('🛑 Auto backup scheduler stopped')
    }
  }
}

export default BackupScheduler
