import { Markup } from 'telegraf'

export default {
  cmd: ['delproduk'],
  desc: 'Hapus produk',
  owner: true,
  
  async run(bot, ctx, db) {
    const products = db.getProducts()
    
    if (products.length === 0) {
      await ctx.reply('❌ Belum ada produk yang tersedia.')
      return
    }

    let message = `
╭━━━━━━━━━━━━━━━━━━╮
│  🗑️ *DELETE PRODUK*
╰━━━━━━━━━━━━━━━━━━╯

Pilih produk yang ingin dihapus:
    `.trim()

    const buttons = products.map(product => [
      Markup.button.callback(
        `${product.nama} (Stock: ${product.stock})`,
        `del_product_${product.id}`
      )
    ])

    const keyboard = Markup.inlineKeyboard(buttons)

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...keyboard
    })
  }
}
