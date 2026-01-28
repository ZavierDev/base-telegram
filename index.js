import { Telegraf } from 'telegraf'
import './config.js'
import './lib/message-helper.js'
import Database from './lib/database.js'
import PluginLoader from './lib/plugin-loader.js'
import BackupScheduler from './lib/backup-scheduler.js'
import ConfigWatcher from './lib/config-watcher.js'
import { handleCallback } from './lib/callbacks.js'

console.log('🎭 Starting Bot Telegram...\n')

// Initialize database (Split: Users & Products)
const db = new Database(global.dbPathUser, global.dbPathProduct)
await db.init()
console.log('💾 Database initialized\n')

// Set owners from config
for (const ownerId of global.owners) {
  await db.addOwner(ownerId)
}

// Initialize bot
const bot = new Telegraf(global.botToken)

// Initialize plugin loader
const pluginLoader = new PluginLoader(bot, db)
await pluginLoader.loadAll()

// Register all callbacks (once at startup)
const { registerCallbacks } = await import('./plugins/info.js')
registerCallbacks(db)

// Initialize backup scheduler
const backupScheduler = new BackupScheduler(bot, db)
backupScheduler.start()

// Initialize config watcher (hot-reload config)
const configWatcher = new ConfigWatcher()
configWatcher.start()

console.log('\n🚀 Bot is ready!\n')

// Handle all text messages
bot.on('text', async (ctx) => {
  await pluginLoader.handleCommand(ctx)
})

// Handle callback queries (for inline buttons)
bot.on('callback_query', async (ctx) => {
  await handleCallback(ctx, db)
})

// Error handling
bot.catch((err, ctx) => {
  console.error('❌ Bot error:', err)
})

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n🛑 Stopping bot...')
  pluginLoader.stop()
  backupScheduler.stop()
  configWatcher.stop()
  bot.stop('SIGINT')
})

process.once('SIGTERM', () => {
  console.log('\n🛑 Stopping bot...')
  pluginLoader.stop()
  backupScheduler.stop()
  configWatcher.stop()
  bot.stop('SIGTERM')
})

// Start bot
bot.launch()
