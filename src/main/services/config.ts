import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

export interface AppConfig {
  window?: {
    width?: number
    height?: number
    x?: number
    y?: number
  }
  serial?: {
    lastUsedPort?: string
    baudRate?: number
    dataBits?: number
    parity?: string
    stopBits?: number
  }
  presets?: string[]
  presetFormats?: string[]
  presetDelays?: number[]
  presetSelected?: boolean[]
  display?: {
    showTimestamp?: boolean
    showDirection?: boolean
    receiveFormat?: string
  }
}

export class ConfigService {
  private configPath: string | null = null
  private configCache: AppConfig | null = null

  private getConfigPath(): string {
    if (!this.configPath) {
      const userDataPath = app.isPackaged
        ? app.getPath('userData')
        : path.join(app.getPath('userData'), 'dev')
      this.configPath = path.join(userDataPath, 'config.json')
    }
    return this.configPath
  }

  private getDefaults(): AppConfig {
    return {
      window: {
        width: 1200,
        height: 800
      },
      serial: {
        lastUsedPort: '',
        baudRate: 115200,
        dataBits: 8,
        parity: 'none',
        stopBits: 1
      },
      presets: Array(99).fill(''),
      presetFormats: Array(99).fill('hex'),
      presetDelays: Array(99).fill(0),
      presetSelected: Array(99).fill(false),
      display: {
        showTimestamp: true,
        showDirection: true,
        receiveFormat: 'hex'
      }
    }
  }

  private loadConfig(): AppConfig {
    if (this.configCache) return this.configCache

    try {
      const configFile = this.getConfigPath()
      if (fs.existsSync(configFile)) {
        const data = fs.readFileSync(configFile, 'utf-8')
        this.configCache = JSON.parse(data)
      } else {
        this.configCache = this.getDefaults()
      }
    } catch (error) {
      console.error('Error loading config:', error)
      this.configCache = this.getDefaults()
    }
    return this.configCache
  }

  private saveConfig(config: AppConfig): { success: boolean; error?: string } {
    try {
      const configFile = this.getConfigPath()
      const configDir = path.dirname(configFile)

      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
      }

      fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8')
      this.configCache = config
      return { success: true }
    } catch (error) {
      console.error('Error saving config:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  get(key?: string): any {
    const config = this.loadConfig()
    if (key) {
      return (config as any)[key]
    }
    return config
  }

  set(key: string, value: any): { success: boolean; error?: string } {
    const config = this.loadConfig()
    ;(config as any)[key] = value
    return this.saveConfig(config)
  }

  clear(): { success: boolean; error?: string } {
    this.configCache = this.getDefaults()
    return this.saveConfig(this.configCache)
  }
}
