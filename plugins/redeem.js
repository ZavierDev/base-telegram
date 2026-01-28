import { formatRupiah } from '../lib/helpers.js'

export default {
  cmd: ['redeem'],
  desc: 'Redeem code untuk dapat saldo',
  owner: false,
  
  async run(bot, ctx, db) {
    const args = ctx.message.text.split(' ')
    
    if (args.length < 2) {
      await ctx.reply(`
╭━━━━━━━━━━━━━━━━━━╮
│  🎁 *REDEEM CODE*
╰━━━━━━━━━━━━━━━━━━╯

Cara pakai:
\`/redeem <CODE>\`

Contoh:
\`/redeem ABC12345\`

💡 Dapatkan code dari owner!
      `.trim(), { parse_mode: 'Markdown' })
      return
    }

    const code = args[1].toUpperCase()

    try {
      const saldo = await db.useRedeemCode(code, ctx.from.id)
      
      await ctx.reply(`
✅ *REDEEM BERHASIL!*

🎁 Code: \`${code}\`
💰 Saldo didapat: ${formatRupiah(saldo)}

━━━━━━━━━━━━━━━━━━
Cek saldo: /mysaldo
      `.trim(), { parse_mode: 'Markdown' })
    } catch (error) {
      await ctx.reply(`❌ ${error.message}`)
    }
  }
}
