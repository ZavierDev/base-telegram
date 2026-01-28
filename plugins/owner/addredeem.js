import { formatRupiah, generateRedeemCode, formatExpiry } from '../../lib/helpers.js'

export default {
  cmd: ['addredeem'],
  desc: 'Buat redeem code',
  owner: true,
  
  async run(bot, ctx, db) {
    const args = ctx.message.text.split(' ')
    
    if (args.length < 2) {
      await ctx.reply(`
╭━━━━━━━━━━━━━━━━━━╮
│  🎁 *ADD REDEEM*
╰━━━━━━━━━━━━━━━━━━╯

Cara pakai:
\`/addredeem <saldo> [code] [expired]\`

Contoh:
\`/addredeem 50000\` - Auto generate code
\`/addredeem 50000 PROMO123\` - Custom code
\`/addredeem 50000 PROMO123 1d\` - Expired 1 hari

Expired format:
• 1h = 1 jam
• 1d = 1 hari  
• 7d = 7 hari
• Kosongkan untuk unlimited

💡 Code akan auto generate jika tidak diisi
      `.trim(), { parse_mode: 'Markdown' })
      return
    }

    const saldo = parseInt(args[1])
    const code = args[2] ? args[2].toUpperCase() : generateRedeemCode()
    const expiredInput = args[3] || null

    if (isNaN(saldo)) {
      await ctx.reply('❌ Saldo harus berupa angka!')
      return
    }

    try {
      const redeemData = await db.createRedeemCode(code, saldo, expiredInput)
      
      await ctx.reply(`
✅ *REDEEM CODE BERHASIL DIBUAT!*

🎁 Code: \`${code}\`
💰 Saldo: ${formatRupiah(saldo)}
⏰ Expired: ${formatExpiry(redeemData.expired)}
📅 Dibuat: ${new Date().toLocaleString('id-ID')}

━━━━━━━━━━━━━━━━━━
Bagikan code ini ke user!
      `.trim(), { parse_mode: 'Markdown' })
    } catch (error) {
      await ctx.reply(`❌ ${error.message}`)
    }
  }
}
