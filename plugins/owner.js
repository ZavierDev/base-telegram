export default {
  cmd: ['owner'],
  desc: 'Info kontak owner',
  owner: false,
  
  async run(bot, ctx, db) {
    const owners = db.getOwners()
    
    if (owners.length === 0) {
      await ctx.reply('❌ Belum ada owner yang terdaftar.')
      return
    }

    let message = `
╭━━━━━━━━━━━━━━━━━━╮
│  👑 *INFO OWNER*
╰━━━━━━━━━━━━━━━━━━╯

Hubungi owner untuk:
• Top up saldo 💰
• Bantuan & support 🆘
• Pertanyaan produk ❓

*Owner List:*
    `.trim()

    for (const ownerId of owners) {
      message += `\n• [Owner](tg://user?id=${ownerId})`
    }

    await ctx.reply(message, { parse_mode: 'Markdown' })
  }
}
