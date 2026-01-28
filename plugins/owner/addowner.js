export default {
  cmd: ['addowner'],
  desc: 'Tambah owner baru',
  owner: true,
  
  async run(bot, ctx, db) {
    const args = ctx.message.text.split(' ')
    
    if (args.length < 2) {
      await ctx.reply(`
╭━━━━━━━━━━━━━━━━━━╮
│  👑 *ADD OWNER*
╰━━━━━━━━━━━━━━━━━━╯

Cara pakai:
\`/addowner <user_id>\`

Contoh:
\`/addowner 123456789\`

💡 Forward pesan user ke @userinfobot untuk dapat ID
      `.trim(), { parse_mode: 'Markdown' })
      return
    }

    const userId = parseInt(args[1])
    
    if (isNaN(userId)) {
      await ctx.reply('❌ User ID harus berupa angka!')
      return
    }

    const success = await db.addOwner(userId)
    
    if (success) {
      await ctx.reply(`✅ Berhasil menambahkan owner!\n\n👑 User ID: \`${userId}\``, {
        parse_mode: 'Markdown'
      })
    } else {
      await ctx.reply('⚠️ User sudah menjadi owner!')
    }
  }
}
