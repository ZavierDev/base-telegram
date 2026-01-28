import { Markup } from 'telegraf'
import { formatRupiah } from '../lib/helpers.js'

export default {
  cmd: ['listproduk'],
  desc: 'Daftar produk tersedia',
  owner: false,
  
  async run(bot, ctx, db) {
    const products = db.getProducts()
    
    if (products.length === 0) {
      await ctx.reply('❌ Belum ada produk yang tersedia.')
      return
    }

    let message = `
╭━━━━━━━━━━━━━━━━━━╮
│  📦 *LIST PRODUK*
╰━━━━━━━━━━━━━━━━━━╯

    `.trim()

    for (const product of products) {
      message += `\n\n🏷️ *${product.nama}*`
      message += `\n💰 Harga: ${formatRupiah(product.harga)}`
      message += `\n📦 Stock: ${product.stock}`
      if (product.deskripsi) {
        message += `\n📝 ${product.deskripsi}`
      }
      message += `\n━━━━━━━━━━━━━━━━━━`
    }

    message += `\n\n💡 Gunakan /buy untuk membeli produk`

    await ctx.reply(message, { parse_mode: 'Markdown' })
  }
}
