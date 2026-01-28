import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

export default {
  cmd: ['backup'],
  desc: 'Backup Source Code & Database (Full ZIP)',
  owner: true,
  
  async run(bot, ctx, db) {
    // Nama file backup
    const date = new Date()
    const timestamp = date.toISOString().replace(/[:.]/g, '-').split('T')
    const zipName = `Backup_Full_Source_${timestamp[0]}_${date.getHours()}-${date.getMinutes()}.zip`
    const zipPath = path.resolve(zipName)

    await ctx.reply('⏳ *Sedang memproses Full Backup (ZIP)...*\n_Mohon tunggu sebentar..._', { parse_mode: 'Markdown' })

    try {
      // 1. Force Save Database
      await db.write()

      // 2. Create ZIP using System 'tar' command (Windows 10+ has tar)
      // Menyertakan: plugins, lib, config.js, index.js, package.json, database
      // Exclude: node_modules, package-lock.json, .git
      const itemsToZip = 'plugins lib config.js index.js package.json database'
      
      // Command: tar -a -c -f <zipName> <items>
      // -a: auto detect compression (zip) based on extension
      await execPromise(`tar -a -c -f "${zipName}" ${itemsToZip}`)

      // 3. Check File Size
      const stats = fs.statSync(zipPath)
      const fileSize = (stats.size / 1024 / 1024).toFixed(2) // MB

      // 4. Send ZIP
      await ctx.replyWithDocument({
        source: zipPath,
        filename: zipName
      }, {
        caption: `
✅ FULL SOURCE CODE BACKUP

📦 File Info:
├ 📂 Nama: ${zipName}
├ 💾 Size: ${fileSize} MB
└ 🕒 Time: ${date.toLocaleString('id-ID')}

📝 Isi Backup:
- 📁 plugins/
- 📁 lib/
- 📁 database/
- 📄 config.js
- 📄 index.js
- 📄 package.json

Backup ini berisi seluruh file sistem bot (kecuali node_modules).
⚠️ Simpan di tempat yang sangat aman!
        `.trim()
        // Removed parse_mode: 'Markdown' to avoid underscore errors in filename
      })

      // 5. Cleanup (Hapus file zip setelah dikirim untuk menghemat ruang)
      fs.unlinkSync(zipPath)

    } catch (error) {
      console.error('Backup Error:', error)
      await ctx.reply(`❌ *Backup Gagal!*\n\nError: \`${error.message}\``, { parse_mode: 'Markdown' })
      
      // Cleanup debris data if exists
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)
    }
  }
}
