export default {
  cmd: ['addproduk'],
  desc: 'Tambah produk baru',
  owner: true,
  
  async run(bot, ctx, db) {
    const q = ctx.message.reply_to_message
    let media = null
    let type = null

    // 1. Cek Reply (Priority 1)
    if (q) {
      if (q.photo) {
        media = q.photo[q.photo.length - 1].file_id
        type = 'image'
      } else if (q.document) {
        media = q.document.file_id
        type = 'document'
      } else if (q.video) {
        media = q.video.file_id
        type = 'video'
      }
    }

    let args = ctx.message.text.split(' ').slice(1).join(' ')
    let parts = args.split('|').map(p => p.trim())

    // 2. Cek URL di argumen pertama (Priority 2 check if no reply, or override?)
    // Kita cek apakah args[0] adalah URL valid
    const isUrl = (url) => /^https?:\/\/.+/i.test(url)

    if (!media && parts.length > 0 && isUrl(parts[0])) {
      media = parts[0]
      type = 'url'
      parts.shift() // Hapus URL dari array agar sisa-nya jadi [nama, harga, stock, ...]
    }

    // Validasi parts setelah potensi URL diambil
    if (!args || (parts.length < 3 && !media && !parts[0])) {
      await ctx.reply(`
╭━━━━━━━━━━━━━━━━━━╮
│  📦 *ADD PRODUK*
│  (Updated by Furina 💧)
╰━━━━━━━━━━━━━━━━━━╯

Cara pakai:
1. *Upload/Reply File* (Gambar/Dokumen):
   Reply file lalu ketik:
   \`/addproduk <nama>|<harga>|<stock>|<deskripsi>\`

2. *Pakai URL Check*:
   \`/addproduk <link_file>|<nama>|<harga>|<stock>|<deskripsi>\`

3. *Normal (Tanpa File)*:
   \`/addproduk <nama>|<harga>|<stock>|<deskripsi>\`

Contoh:
\`/addproduk https://img.com/foto.jpg|Akun Sultan|50000|10|Full Skin\`
      `.trim(), { parse_mode: 'Markdown' })
      return
    }

    if (parts.length < 3) {
      await ctx.reply('❌ Format salah! Minimal: nama|harga|stock\nPastikan pakai tanda | sebagai pemisah.')
      return
    }

    const [nama, hargaStr, stockStr, deskripsi = ''] = parts
    const harga = parseInt(hargaStr)
    const stock = parseInt(stockStr)

    if (isNaN(harga) || isNaN(stock)) {
      await ctx.reply('❌ Harga dan stock harus berupa angka!')
      return
    }

    // Prepare data
    const itemData = {
      nama,
      harga,
      stock,
      deskripsi,
      // Jika ada media, masukkan
      ...(media && { media: { type, url: media } })
    }

    const product = await db.addProduct(itemData)

    // TRACE LOG
    console.log(`[TRACE PRODUCT] ➕ New Product Created:
    - ID: ${product.id}
    - Name: ${product.nama}
    - Stock: ${product.stock}
    - Media Detected: ${media ? 'YES' : 'NO'} (${type})
    - DB Entry Media: ${JSON.stringify(product.media)}`)

    let infoMedia = ''
    
    // --- MEDIA DOWNLOAD LOGIC (BACKUP LOCAL) ---
    if (media) {
      try {
        const axios = (await import('axios')).default
        const fs = (await import('fs')).default
        const path = (await import('path')).default

        console.log(`[TRACE DOWNLOAD] ⬇️ Starting download for Product ${product.id}...`)
        
        let fileLink = null
        let ext = 'jpg' // default

        // Determine extension & link
        if (type === 'url') {
            fileLink = media
            if (media.includes('.png')) ext = 'png'
            else if (media.includes('.mp4')) ext = 'mp4'
        } else {
            // Telegram File
            fileLink = await ctx.telegram.getFileLink(media)
            const filePath = fileLink.pathname 
            const pathExt = path.extname(filePath)
            if (pathExt) ext = pathExt.replace('.', '')
        }

        // Setup Local Path
        const productsDir = path.resolve('database/products')
        if (!fs.existsSync(productsDir)) fs.mkdirSync(productsDir, { recursive: true })
        
        const fileName = `${product.id}.${ext}` // SYNC WITH DB ID
        const localFilePath = path.join(productsDir, fileName)
        
        // Download
        const response = await axios({
            url: fileLink.href || fileLink, 
            method: 'GET',
            responseType: 'stream'
        })

        const writer = fs.createWriteStream(localFilePath)
        response.data.pipe(writer)

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
        })

        console.log(`[TRACE DOWNLOAD] ✅ Download Success: ${fileName}`)
        
        // UPDATE DB WITH LOCAL PATH
        product.media = {
            type: type,
            url: media, 
            localPath: localFilePath 
        }
        
        // Save update
        await db.write() // Persist media update
        
        infoMedia = `\n📎 *Media Attached*: ${type}\n💾 *Saved*: \`${fileName}\``

      } catch (err) {
        console.error(`[TRACE DOWNLOAD] ❌ Failed:`, err.message)
        infoMedia = `\n📎 *Media Attached*: ${type} (Download Failed)`
      }
    }

    await ctx.reply(`
✅ *PRODUK BERHASIL DITAMBAHKAN!*

🏷️ Nama: ${product.nama}
💰 Harga: Rp ${product.harga.toLocaleString('id-ID')}
📦 Stock: ${product.stock}
📝 Deskripsi: ${product.deskripsi || '-'}
${infoMedia}
🆔 ID: \`${product.id}\`
    `.trim(), { parse_mode: 'Markdown' })
  }
}
