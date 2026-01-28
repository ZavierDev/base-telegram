import { formatRupiah } from '../../lib/helpers.js'

export default {
  cmd: ['addsaldo'],
  desc: 'Tambah saldo user',
  owner: true,
  
  async run(bot, ctx, db) {
    const args = ctx.message.text.split(' ')
    
    if (args.length < 3) {
      await ctx.reply(`
╭━━━━━━━━━━━━━━━━━━╮
│  💰 *ADD SALDO*
╰━━━━━━━━━━━━━━━━━━╯

Cara pakai:
\`/addsaldo <user_id> <amount>\`

Contoh:
\`/addsaldo 123456789 50000\`

💡 Gunakan angka negatif untuk mengurangi saldo
      `.trim(), { parse_mode: 'Markdown' })
      return
    }

    const userId = parseInt(args[1])
    const amount = parseInt(args[2])

    if (isNaN(userId) || isNaN(amount)) {
      await ctx.reply('❌ User ID dan amount harus berupa angka!')
      return
    }

    // Ensure user exists
    await db.createUser(userId, 'Unknown')
    
    const newSaldo = await db.updateSaldo(userId, amount)

    await ctx.reply(`
✅ *SALDO BERHASIL DIUPDATE!*

👤 User ID: \`${userId}\`
${amount >= 0 ? '➕' : '➖'} Amount: ${formatRupiah(Math.abs(amount))}
💰 Saldo baru: ${formatRupiah(newSaldo)}
    `.trim(), { parse_mode: 'Markdown' })
  }
}
