import { watch } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const configPath = join(__dirname, '../config.js')

class ConfigWatcher {
  constructor() {
    this.watcher = null
  }

  start() {
    this.watcher = watch(configPath, async (eventType) => {
      if (eventType === 'change') {
        await this.reloadConfig()
      }
    })
    
    console.log('🔥 Config hot-reload enabled!')
  }

  async reloadConfig() {
    try {
      // Clear module cache
      const configUrl = `${configPath}?update=${Date.now()}`
      
      // Re-import config (will re-execute and update globals)
      await import(configUrl)
      
      console.log('🔄 Config reloaded!')
    } catch (error) {
      console.error('❌ Config reload error:', error.message)
    }
  }

  stop() {
    if (this.watcher) {
      this.watcher.close()
      console.log('🛑 Config watcher stopped')
    }
  }
}

export default ConfigWatcher
