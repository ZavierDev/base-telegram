import { readdirSync, statSync, watch } from 'fs'
import { join, dirname } from 'path'
import { pathToFileURL } from 'url'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

class PluginLoader {
  constructor(bot, db) {
    this.bot = bot
    this.db = db
    this.plugins = new Map()
    this.pluginPaths = new Map()
    this.watchers = []
  }

  async loadAll() {
    const pluginsDir = join(__dirname, '../plugins')
    await this.loadFromDirectory(pluginsDir)
    
    console.log(`✅ Loaded ${this.plugins.size} plugins`)
    this.startHotReload()
  }

  async loadFromDirectory(dir, isOwnerDir = false) {
    try {
      const files = readdirSync(dir)
      
      for (const file of files) {
        const fullPath = join(dir, file)
        const stat = statSync(fullPath)
        
        if (stat.isDirectory()) {
          // Check if it's owner directory
          const isOwner = file === 'owner'
          await this.loadFromDirectory(fullPath, isOwner)
        } else if (file.endsWith('.js')) {
          await this.loadPlugin(fullPath, isOwnerDir)
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Error loading from ${dir}:`, error)
      }
    }
  }

  async loadPlugin(filePath, isOwnerOnly = false) {
    try {
      // Use timestamp to bust cache for hot-reload
      const fileUrl = pathToFileURL(filePath).href + `?update=${Date.now()}`
      const module = await import(fileUrl)
      const plugin = module.default

      if (!plugin || !plugin.cmd || !plugin.run) {
        console.warn(`⚠️  Invalid plugin format: ${filePath}`)
        return
      }

      // Ensure cmd is array
      const commands = Array.isArray(plugin.cmd) ? plugin.cmd : [plugin.cmd]
      
      // Override owner flag if in owner directory
      if (isOwnerOnly) {
        plugin.owner = true
      }

      // Register all command aliases
      for (const cmd of commands) {
        const commandName = cmd.startsWith('/') ? cmd : `/${cmd}`
        this.plugins.set(commandName, plugin)
        this.pluginPaths.set(commandName, filePath)
      }

      console.log(`📦 Loaded: ${commands.join(', ')} ${plugin.owner ? '👑' : ''}`)
    } catch (error) {
      console.error(`❌ Error loading plugin ${filePath}:`, error.message)
    }
  }

  async reloadPlugin(filePath) {
    // Find and remove old commands for this file
    const commandsToRemove = []
    for (const [cmd, path] of this.pluginPaths.entries()) {
      if (path === filePath) {
        commandsToRemove.push(cmd)
      }
    }

    for (const cmd of commandsToRemove) {
      this.plugins.delete(cmd)
      this.pluginPaths.delete(cmd)
    }

    // Reload the plugin
    const isOwnerDir = filePath.includes('\\owner\\') || filePath.includes('/owner/')
    await this.loadPlugin(filePath, isOwnerDir)
    console.log(`🔄 Reloaded: ${filePath}`)
  }

  startHotReload() {
    const pluginsDir = join(__dirname, '../plugins')
    
    const watcher = watch(pluginsDir, { recursive: true }, async (eventType, filename) => {
      if (filename && filename.endsWith('.js')) {
        const fullPath = join(pluginsDir, filename)
        
        if (eventType === 'change') {
          await this.reloadPlugin(fullPath)
        } else if (eventType === 'rename') {
          // Check if file exists (created) or deleted
          try {
            statSync(fullPath)
            await this.reloadPlugin(fullPath)
          } catch {
            // File deleted, remove from plugins
            for (const [cmd, path] of this.pluginPaths.entries()) {
              if (path === fullPath) {
                this.plugins.delete(cmd)
                this.pluginPaths.delete(cmd)
              }
            }
            console.log(`🗑️  Removed: ${fullPath}`)
          }
        }
      }
    })

    this.watchers.push(watcher)
    console.log('🔥 Hot-reload enabled!')
  }

  async handleCommand(ctx) {
    const message = ctx.message
    if (!message || !message.text) return

    const text = message.text.trim()
    const command = text.split(' ')[0]
    
    const plugin = this.plugins.get(command)
    if (!plugin) return

    // Check owner permission
    if (plugin.owner && !this.db.isOwner(ctx.from.id)) {
      await ctx.reply('❌ Command ini hanya untuk owner!')
      return
    }

    // Ensure user exists in database
    await this.db.createUser(ctx.from.id, ctx.from.username)

    // Run plugin
    try {
      await plugin.run(this.bot, ctx, this.db)
    } catch (error) {
      console.error(`Error in plugin ${command}:`, error)
      await ctx.reply('❌ Terjadi error saat menjalankan command!')
    }
  }

  stop() {
    for (const watcher of this.watchers) {
      watcher.close()
    }
    console.log('🛑 Hot-reload stopped')
  }
}

export default PluginLoader
