// Universal callback handler yang auto-register dari plugins
class CallbackHandler {
  constructor() {
    this.handlers = new Map()
  }

  // Register callback dari plugin
  register(callbackId, handler) {
    this.handlers.set(callbackId, handler)
    console.log(`📌 Registered callback: ${callbackId}`)
  }

  // Handle callback query
  async handle(ctx, db) {
    const callbackData = ctx.callbackQuery.data
    
    try {
      // Answer callback query first
      await ctx.answerCbQuery()
      
      // Check if handler exists
      if (this.handlers.has(callbackData)) {
        await this.handlers.get(callbackData)(ctx, db)
        return
      }
      
      // Check for dynamic patterns (prefix matching)
      for (const [pattern, handler] of this.handlers.entries()) {
        if (callbackData.startsWith(pattern + '_')) {
          await handler(ctx, db, callbackData)
          return
        }
      }
      
      // If no handler found, ignore silently
      console.log(`⚠️  No handler for callback: ${callbackData}`)
    } catch (error) {
      console.error('Callback error:', error)
      await ctx.answerCbQuery('❌ Terjadi error!')
    }
  }
}

// Initialize global callback handler
global.callback = new CallbackHandler()

// Export handle function untuk dipanggil dari index.js
export async function handleCallback(ctx, db) {
  await global.callback.handle(ctx, db)
}

