export default {
  cmd: ['delowner'],
  desc: 'Hapus owner',
  owner: true,
  
  async run(bot, ctx, db) {
    const args = ctx.message.text.split(' ')
    
    if (args.length < 2) {
      await ctx.reply(`
╭━━━━━━━━━━━━━━━━━━╮
│  👑 *DELETE OWNER*
╰━━━━━━━━━━━━━━━━━━╯

Cara pakai:
\`/delowner <user_id>\`

Contoh:
\`/delowner 123456789\`

⚠️ Gunakan /listowner untuk melihat daftar owner
      `.trim(), { parse_mode: 'Markdown' })
      return
    }

    const userId = parseInt(args[1])
    
    if (isNaN(userId)) {
      await ctx.reply('❌ User ID harus berupa angka!')
      return
    }

    if (userId === ctx.from.id) {
      await ctx.reply('❌ Kamu tidak bisa menghapus diri sendiri!')
      return
    }

    const success = await db.removeOwner(userId)
    
    if (success) {
      await ctx.reply(`✅ Berhasil menghapus owner!\n\n👤 User ID: \`${userId}\``, {
        parse_mode: 'Markdown'
      })
    } else {
      await ctx.reply('⚠️ User bukan owner!')
    }
  }
}
