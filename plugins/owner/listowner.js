export default {
  cmd: ['listowner'],
  desc: 'List semua owner',
  owner: true,
  
  async run(bot, ctx, db) {
    const owners = db.getOwners()
    
    if (owners.length === 0) {
      await ctx.reply('❌ Belum ada owner yang terdaftar.')
      return
    }

    let message = `
╭━━━━━━━━━━━━━━━━━━╮
│  👑 *LIST OWNER*
╰━━━━━━━━━━━━━━━━━━╯

Total: ${owners.length} owner(s)

    `.trim()

    for (let i = 0; i < owners.length; i++) {
      const ownerId = owners[i]
      const user = db.getUser(ownerId)
      
      message += `\n${i + 1}. [${user?.username || 'Unknown'}](tg://user?id=${ownerId})`
      message += `\n   ID: \`${ownerId}\``
      message += `\n`
    }

    await ctx.reply(message, { parse_mode: 'Markdown' })
  }
}
