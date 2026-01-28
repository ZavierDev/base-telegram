import { Markup } from 'telegraf'
import { formatRupiah } from '../lib/helpers.js'

export default {
  cmd: ['start'],
  desc: 'Mulai bot & welcome message',
  owner: false,
  
  async run(bot, ctx, db) {
    const user = await db.createUser(ctx.from.id, ctx.from.username)
    const isOwner = db.isOwner(ctx.from.id)
    
    // Safe Stats Retrieval
    let stats = { totalUsers: 0, totalOrders: 0, totalProducts: 0 }
    try {
        if (typeof db.getStats === 'function') {
            stats = db.getStats()
        } else {
            // Fallback manual count if getStats missing (Migration state safeguard)
            // Note: This prevents crash if DB instance is stale
            if (db.data && db.data.users) stats.totalUsers = Object.keys(db.data.users).length
            if (db.data && db.data.stats) stats.totalOrders = db.data.stats.totalOrders || 0
            // products might be in prodDb, skip for safety if stale
        }
    } catch (e) {
        console.error('Stats error:', e)
    }

    const welcomeMessage = `*🎭 Welcome!*

ʜᴀʟᴏ *${user.username}*! 👋
${isOwner ? '👑 ᴡᴇʟᴄᴏᴍᴇ ʙᴀᴄᴋ, ᴏᴡɴᴇʀ!\n' : ''}
*ᴍᴇɴᴜ ᴜᴛᴀᴍᴀ:*
/info - ɪɴꜰᴏ ᴀᴋᴜɴ
/mysaldo - ᴄᴇᴋ ꜱᴀʟᴅᴏ
/buy - ʙᴇʟɪ ᴘʀᴏᴅᴜᴋ
/listproduk - ʟɪꜱᴛ ᴘʀᴏᴅᴜᴋ
/redeem - ʀᴇᴅᴇᴇᴍ ᴄᴏᴅᴇ
/owner - ʜᴜʙᴜɴɢɪ ᴏᴡɴᴇʀ
${isOwner ? `
*ᴍᴇɴᴜ ᴏᴡɴᴇʀ:*
/addowner - ᴛᴀᴍʙᴀʜ ᴏᴡɴᴇʀ
/delowner - ʜᴀᴘᴜꜱ ᴏᴡɴᴇʀ
/listowner - ʟɪꜱᴛ ᴏᴡɴᴇʀ
/backup - ʙᴀᴄᴋᴜᴘ ᴅᴀᴛᴀʙᴀꜱᴇ
/addproduk - ᴛᴀᴍʙᴀʜ ᴘʀᴏᴅᴜᴋ
/delproduk - ʜᴀᴘᴜꜱ ᴘʀᴏᴅᴜᴋ
/addsaldo - ᴛᴀᴍʙᴀʜ ꜱᴀʟᴅᴏ
/addredeem - ʙᴜᴀᴛ ʀᴇᴅᴇᴇᴍ
` : ''}
📊 *STATISTIK BOT*
👥 *Total User*: ${stats.totalUsers}
🛒 *Order Sukses*: ${stats.totalOrders}
📦 *Total Produk*: ${stats.totalProducts}`

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('📋 Info & Menu', 'show_info'),
        Markup.button.callback('💰 Cek Saldo', 'check_saldo')
      ],
      [
        Markup.button.callback('🛒 Beli Produk', 'buy_product'),
        Markup.button.callback('📦 List Produk', 'list_products')
      ],
      isOwner ? [
        Markup.button.callback('👑 Menu Owner', 'owner_menu')
      ] : []
    ].filter(row => row.length > 0))

    await ctx.replyWithPhoto(global.imgWelcome, {
      caption: welcomeMessage,
      parse_mode: 'Markdown',
      ...keyboard
    })
  }
}
