import { Markup } from 'telegraf'
import { formatRupiah } from '../lib/helpers.js'

export default {
  cmd: ['mysaldo'],
  desc: 'Cek saldo user',
  owner: false,
  
  async run(bot, ctx, db) {
    const user = await db.createUser(ctx.from.id, ctx.from.username)
    
    const message = `
╭━━━━━━━━━━━━━━━━━━╮
│  💰 *SALDO KAMU*
╰━━━━━━━━━━━━━━━━━━╯

💵 *Saldo:* ${formatRupiah(user.saldo)}

${user.saldo === 0 ? '⚠️ Saldo kamu masih kosong!\nHubungi owner untuk top up.' : '✅ Saldo kamu cukup untuk belanja!'}
    `.trim()

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('💳 Top Up', 'contact_owner'),
        Markup.button.callback('🛒 Belanja', 'buy_product')
      ]
    ])

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...keyboard
    })
  }
}
