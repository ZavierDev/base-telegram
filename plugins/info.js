import { Markup } from 'telegraf'
import { formatRupiah } from '../lib/helpers.js'

// Register all callbacks once at startup
export function registerCallbacks(db) {
  // Refresh info
  global.callback.register('refresh_info', async (ctx, db) => {
    const user = await db.createUser(ctx.from.id, ctx.from.username)
    
    const info = `*📋 Dashboard*

👤 ${user.username}
🆔 \`${ctx.from.id}\`
${user.role === 'owner' ? '👑' : '👥'} ${user.role === 'owner' ? 'Owner' : 'Guest'}
💰 ${formatRupiah(user.saldo)}

ᴊᴏɪɴᴇᴅ: ${new Date(user.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🔄 Refresh', 'refresh_info'),
        Markup.button.callback('💰 Cek Saldo', 'check_saldo')
      ],
      [
        Markup.button.callback('🛒 Beli Produk', 'buy_product'),
        Markup.button.callback('📦 List Produk', 'list_products')
      ],
      [
        Markup.button.callback('🎁 Redeem Code', 'redeem_prompt')
      ]
    ])

    await global.sendButton(ctx, info, {
      parse_mode: 'Markdown',
      ...keyboard
    })
  })

  // Show info (alias for refresh_info)
  global.callback.register('show_info', async (ctx, db) => {
    const handler = global.callback.handlers.get('refresh_info')
    if (handler) await handler(ctx, db)
  })

  // Check saldo
  global.callback.register('check_saldo', async (ctx, db) => {
    const user = await db.createUser(ctx.from.id, ctx.from.username)
    
    const message = `*💰 Saldo*

💵 ${formatRupiah(user.saldo)}

${user.saldo === 0 ? 'ꜱᴀʟᴅᴏ ᴋᴏꜱᴏɴɢ, ʜᴜʙᴜɴɢɪ ᴏᴡɴᴇʀ ᴜɴᴛᴜᴋ ᴛᴏᴘ ᴜᴘ' : 'ꜱᴀʟᴅᴏ ᴄᴜᴋᴜᴘ ᴜɴᴛᴜᴋ ʙᴇʟᴀɴᴊᴀ'}`

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('💳 Top Up', 'contact_owner'),
        Markup.button.callback('🛒 Belanja', 'buy_product')
      ],
      [
        Markup.button.callback('🔙 Kembali', 'refresh_info')
      ]
    ])

    await global.sendButton(ctx, message, {
      parse_mode: 'Markdown',
      ...keyboard
    })
  })

  // Buy product menu
  global.callback.register('buy_product', async (ctx, db) => {
    const products = db.getProducts()
    const user = await db.createUser(ctx.from.id, ctx.from.username)
    
    if (products.length === 0) {
      await global.sendButton(ctx, '❌ ʙᴇʟᴜᴍ ᴀᴅᴀ ᴘʀᴏᴅᴜᴋ', { 
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Kembali ke Menu', 'refresh_info')]
        ])
      })
      return
    }

    let message = `*🛒 Beli Produk*

💰 ${formatRupiah(user.saldo)}

ᴘɪʟɪʜ ᴘʀᴏᴅᴜᴋ:`

    const buttons = products
      .filter(p => p.stock > 0)
      .map(product => [
        Markup.button.callback(
          `${product.nama} - ${formatRupiah(product.harga)}`,
          `buy_${product.id}`
        )
      ])

    if (buttons.length === 0) {
      await global.sendButton(ctx, '❌ ꜱᴇᴍᴜᴀ ᴘʀᴏᴅᴜᴋ ʜᴀʙɪꜱ', { 
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Kembali ke Menu', 'refresh_info')]
        ])
      })
      return
    }

    buttons.push([Markup.button.callback('🔙 Kembali', 'refresh_info')])

    const keyboard = Markup.inlineKeyboard(buttons)

    await global.sendButton(ctx, message, {
      parse_mode: 'Markdown',
      ...keyboard
    })
  })

  // List products
  global.callback.register('list_products', async (ctx, db) => {
    const products = db.getProducts()
    
    if (products.length === 0) {
      await global.sendButton(ctx, '❌ ʙᴇʟᴜᴍ ᴀᴅᴀ ᴘʀᴏᴅᴜᴋ', { 
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Kembali ke Menu', 'refresh_info')]
        ])
      })
      return
    }

    let message = `*📦 List Produk*\n`

    for (const product of products) {
      message += `\n${product.nama}`
      message += `\n💰 ${formatRupiah(product.harga)} • 📦 ${product.stock}`
      if (product.deskripsi) {
        message += `\nᴅᴇꜱᴄ: ${product.deskripsi}`
      }
      message += `\n`
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🛒 Beli Produk', 'buy_product')],
      [Markup.button.callback('🔙 Kembali', 'refresh_info')]
    ])

    await global.sendButton(ctx, message, {
      parse_mode: 'Markdown',
      ...keyboard
    })
  })

  // Redeem prompt
  global.callback.register('redeem_prompt', async (ctx, db) => {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Kembali ke Menu', 'refresh_info')]
    ])

    await ctx.reply('*🎁 Redeem Code*\n\nGunakan command: `/redeem <CODE>`\n\nContoh: `/redeem PROMO123`', {
      parse_mode: 'Markdown',
      ...keyboard
    })
  })

  // Contact owner
  global.callback.register('contact_owner', async (ctx, db) => {
    const owners = db.getOwners()
    
    if (owners.length === 0) {
      await global.sendButton(ctx, '❌ ʙᴇʟᴜᴍ ᴀᴅᴀ ᴏᴡɴᴇʀ', { 
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Kembali ke Menu', 'refresh_info')]
        ])
      })
      return
    }

    let message = `*👑 Owner*

ʜᴜʙᴜɴɢɪ ᴏᴡɴᴇʀ ᴜɴᴛᴜᴋ:
• ᴛᴏᴘ ᴜᴘ ꜱᴀʟᴅᴏ
• ʙᴀɴᴛᴜᴀɴ & ꜱᴜᴘᴘᴏʀᴛ
• ᴘᴇʀᴛᴀɴʏᴀᴀɴ ᴘʀᴏᴅᴜᴋ
`

    for (const ownerId of owners) {
      message += `\n[Owner](tg://user?id=${ownerId})`
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Kembali', 'refresh_info')]
    ])

    await global.sendButton(ctx, message, {
      parse_mode: 'Markdown',
      ...keyboard
    })
  })

  // Owner menu
  global.callback.register('owner_menu', async (ctx, db) => {
    if (!db.isOwner(ctx.from.id)) {
      await ctx.answerCbQuery('❌ ᴋᴀᴍᴜ ʙᴜᴋᴀɴ ᴏᴡɴᴇʀ')
      return
    }

    const message = `*👑 Menu Owner*

/addowner - ᴛᴀᴍʙᴀʜ ᴏᴡɴᴇʀ
/delowner - ʜᴀᴘᴜꜱ ᴏᴡɴᴇʀ
/listowner - ʟɪꜱᴛ ᴏᴡɴᴇʀ
/backup - ʙᴀᴄᴋᴜᴘ ᴅᴀᴛᴀʙᴀꜱᴇ
/addproduk - ᴛᴀᴍʙᴀʜ ᴘʀᴏᴅᴜᴋ
/delproduk - ʜᴀᴘᴜꜱ ᴘʀᴏᴅᴜᴋ
/addsaldo - ᴛᴀᴍʙᴀʜ ꜱᴀʟᴅᴏ
/addredeem - ʙᴜᴀᴛ ʀᴇᴅᴇᴇᴍ`

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Kembali', 'refresh_info')]
    ])

    await global.sendButton(ctx, message, {
      parse_mode: 'Markdown',
      ...keyboard
    })
  })

  // Buy product (dynamic)
  global.callback.register('buy', async (ctx, db, callbackData) => {
    const productId = callbackData.replace('buy_', '')
    
    // Gunakan method getter resmi dari class Database (Safe & Compatible)
    const product = db.getProduct(productId)
    const userId = ctx.from.id
    
    // Ensure user exists
    let user = db.getUser(userId)
    if (!user) {
        user = await db.createUser(userId, ctx.from.username)
    }

    if (!product) {
      await ctx.answerCbQuery('❌ ᴘʀᴏᴅᴜᴋ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ')
      return
    }
    
    if (product.stock <= 0) {
      await ctx.answerCbQuery('❌ ᴘʀᴏᴅᴜᴋ ʜᴀʙɪꜱ')
      return
    }
    
    if (user.saldo < product.harga) {
      await ctx.answerCbQuery(`❌ ꜱᴀʟᴅᴏ ᴋᴜʀᴀɴɢ (${formatRupiah(user.saldo)})`)
      return
    }
    
    // TRANSACTION START
    const saldoBefore = user.saldo
    const stockBefore = product.stock
    
    // 1. Kurangi Saldo User
    user.saldo -= product.harga
    
    // 2. Kurangi Stock Produk
    product.stock -= 1
    
    // TRACE LOG
    console.log(`[TRACE TRANSACTION] 🛒 Buy Event:
    - User: ${userId} (${ctx.from.username})
    - Product: ${product.nama} (${productId})
    - Saldo: ${saldoBefore} -> ${user.saldo}
    - Stock: ${stockBefore} -> ${product.stock}
    - Status: MEMORY UPDATED ✅`)

    // 3. Update Stats
    await db.addSuccessfulOrder()
    
    // 4. Save Changes to Disk (Unified Write)
    await db.write() // Saves both userDb and prodDb
    console.log(`[TRACE TRANSACTION] 💾 Disk Sync Completed`)
    
    // Caption Message (Unified)
    let caption = `*✅ Pembelian Berhasil*\n\n` +
                  `🏷️ ${product.nama}\n` +
                  `💰 ${formatRupiah(product.harga)}\n` +
                  `💵 ꜱɪꜱᴀ ꜱᴀʟᴅᴏ: ${formatRupiah(user.saldo)}\n`

    if (product.deskripsi) caption += `\n📝 ${product.deskripsi}`
    caption += `\n\n_Terima kasih sudah berbelanja!_ 🎉`

    const backButton = Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Kembali', 'refresh_info')]
    ])

    // 1. Send Text Confirmation (Selalu kirim ini dulu)
    await global.sendButton(ctx, caption, { parse_mode: 'Markdown', ...backButton })

    // 2. Send Product Media if available (Terpisah)
    try {
        if (product.media) {
            console.log(`[TRACE MEDIA] Checking media for product ${product.id}...`)
            const { type, url, localPath } = product.media
            
            console.log(`[TRACE MEDIA] Found media! Type: ${type}, Local: ${localPath || 'None'}`)
            
            // Prioritize Local File
            const mediaSource = localPath ? { source: localPath } : url

            // Kirim File Terpisah
            if (type === 'image') {
                await ctx.replyWithPhoto(mediaSource, { caption: `_File Produk: ${product.nama}_`, parse_mode: 'Markdown' })
            } else if (type === 'video') {
                await ctx.replyWithVideo(mediaSource, { caption: `_File Produk: ${product.nama}_`, parse_mode: 'Markdown' })
            } else if (type === 'document') {
                await ctx.replyWithDocument(mediaSource, { caption: `_File Produk: ${product.nama}_`, parse_mode: 'Markdown' })
            } else if (type === 'url') {
                await ctx.reply(`🔗 *Link Download*: ${url}`, { parse_mode: 'Markdown' })
            }
            
            console.log('[TRACE MEDIA] Send success!')
        }
        
        // Notifikasi Toast
        await ctx.answerCbQuery('✅ Berhasil dibeli!')
        
    } catch (err) {
        console.error('[TRACE MEDIA] ERROR:', err)
        // Fallback info only, don't spam chat if text already sent
        console.log('Failed to send media.')
    }
  })

  // Delete product (dynamic)
  global.callback.register('del_product', async (ctx, db, callbackData) => {
    if (!db.isOwner(ctx.from.id)) {
      await ctx.answerCbQuery('❌ ᴋᴀᴍᴜ ʙᴜᴋᴀɴ ᴏᴡɴᴇʀ')
      return
    }

    const productId = callbackData.replace('del_product_', '')
    const product = db.getProduct(productId)
    
    if (!product) {
      await ctx.answerCbQuery('❌ ᴘʀᴏᴅᴜᴋ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ')
      return
    }

    await db.deleteProduct(productId)
    
    await global.sendButton(ctx, `*✅ Produk Dihapus*

🏷️ ${product.nama}
💰 ${formatRupiah(product.harga)}`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Kembali ke Menu', 'refresh_info')]
      ])
    })
  })

  console.log('✅ All callbacks registered!')
}

export default {
  cmd: ['info', 'menu'],
  desc: 'Menampilkan informasi user',
  owner: false,
  
  async run(bot, ctx, db) {
    const user = await db.createUser(ctx.from.id, ctx.from.username)
    
    const info = `*📋 Dashboard*

👤 ${user.username}
🆔 \`${ctx.from.id}\`
${user.role === 'owner' ? '👑' : '👥'} ${user.role === 'owner' ? 'Owner' : 'Guest'}
💰 ${formatRupiah(user.saldo)}

ᴊᴏɪɴᴇᴅ: ${new Date(user.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('🔄 Refresh', 'refresh_info'),
        Markup.button.callback('💰 Cek Saldo', 'check_saldo')
      ],
      [
        Markup.button.callback('🛒 Beli Produk', 'buy_product'),
        Markup.button.callback('📦 List Produk', 'list_products')
      ],
      [
        Markup.button.callback('🎁 Redeem Code', 'redeem_prompt')
      ]
    ])

    await ctx.replyWithPhoto(global.imgDashboard, {
      caption: info,
      parse_mode: 'Markdown',
      ...keyboard
    })
  }
}
