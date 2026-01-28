import { Markup } from 'telegraf'

// Helper function to safely edit message (auto-detect photo or text)
async function safeEditMessage(ctx, content, options) {
  try {
    // Try editMessageCaption first (for photo messages)
    await ctx.editMessageCaption(content, options)
  } catch (error) {
    if (error.description?.includes('no caption')) {
      // If no caption, try editMessageText
      try {
        await ctx.editMessageText(content, options)
      } catch (err) {
        if (err.description?.includes('not modified')) {
          // Message is the same, just answer callback
          await ctx.answerCbQuery()
        } else {
          throw err
        }
      }
    } else if (error.description?.includes('not modified')) {
      // Message is the same, just answer callback
      await ctx.answerCbQuery()
    } else {
      throw error
    }
  }
}

// Set as global with short name
global.sendButton = safeEditMessage

console.log('✅ Global helpers loaded!')

