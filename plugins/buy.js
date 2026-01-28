import { Markup } from 'telegraf'
import { formatRupiah } from '../lib/helpers.js'

export default {
  cmd: ['buy'],
  desc: 'Menu pembelian produk',
  owner: false,
  
  async run(bot, ctx, db) {
    const products = db.getProducts()
    const user = await db.createUser(ctx.from.id, ctx.from.username)
    
    if (products.length === 0) {
      await ctx.reply('❌ Belum ada produk yang tersedia.')
      return
    }

    let message = `
╭━━━━━━━━━━━━━━━━━━╮
│  🛒 *BELI PRODUK*
╰━━━━━━━━━━━━━━━━━━╯

💰 Saldo kamu: ${formatRupiah(user.saldo)}

Pilih produk yang ingin dibeli:
    `.trim()

    // Create buttons for each product
    const buttons = products
      // .filter(p => p.stock > 0) // Jangan difilter, tampilkan tapi tandai HABIS
      .map(product => {
        const isHabis = product.stock <= 0
        const label = isHabis 
            ? `🔴 HABIS - ${product.nama}` 
            : `${product.nama} - ${formatRupiah(product.harga)}`
            
        // Kalau habis, callbacknya beda atau tetap buy tapi nanti ditolak di handler
        return [
            Markup.button.callback(label, `buy_${product.id}`)
        ]
      })

    if (buttons.length === 0) {
      await ctx.reply('❌ Tidak ada data produk.')
      return
    }

    const keyboard = Markup.inlineKeyboard(buttons)

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...keyboard
    })
  }
}
