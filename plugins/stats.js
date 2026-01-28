export default {
  cmd: ['stats', 'status', 'botstats'],
  desc: 'Menampilkan statistik bot',
  owner: false, // Public, tapi mungkin hanya owner yang butuh detail. Let's make it public for transparency or check owner inside.
  
  async run(bot, ctx, db) {
    const stats = db.getStats()
    const uptime = process.uptime()
    
    // Format Uptime
    const days = Math.floor(uptime / (3600 * 24))
    const hours = Math.floor((uptime % (3600 * 24)) / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = Math.floor(uptime % 60)
    
    const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`

    // Get Memory Usage
    const memoryUsage = process.memoryUsage()
    const ramUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2)

    await ctx.reply(`
📊 *STATISTIK BOT*

👥 *Total User*: ${stats.totalUsers}
🛒 *Order Sukses*: ${stats.totalOrders}
📦 *Total Produk*: ${stats.totalProducts}

⏳ *Uptime*: ${uptimeStr}
💾 *RAM*: ${ramUsed} MB
    `.trim(), { parse_mode: 'Markdown' })
  }
}
