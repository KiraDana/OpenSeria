import { BrowserWindow, screen, app } from 'electron'
import { join } from 'path'
import { ConfigService } from '../services/config'

export class WindowManager {
  private mainWindow: BrowserWindow | null = null
  private configService: ConfigService

  constructor(configService: ConfigService) {
    this.configService = configService
  }

  async createWindow(): Promise<BrowserWindow> {
    const config = this.configService.get() as any
    const windowConfig = config.window || {}

    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize
    const windowWidth = windowConfig.width || 1200
    const windowHeight = windowConfig.height || 800

    let x: number | undefined
    let y: number | undefined

    if (windowConfig.x !== undefined && windowConfig.y !== undefined) {
      x = windowConfig.x
      y = windowConfig.y
    } else {
      x = Math.round((screenWidth - windowWidth) / 2)
      y = Math.round((screenHeight - windowHeight) / 2)
    }

    this.mainWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x,
      y,
      minWidth: 900,
      minHeight: 600,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false
      },
      frame: true,
      show: true
    })

    const isDev = !app.isPackaged

    if (isDev) {
      try {
        await this.mainWindow.loadURL('http://localhost:5173')
      } catch (error) {
        console.error('Failed to load dev server:', error)
        await this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
      }
    } else {
      await this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    this.mainWindow.on('close', () => {
      if (this.mainWindow) {
        const bounds = this.mainWindow.getBounds()
        this.configService.set('window', bounds)
      }
    })

    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })

    return this.mainWindow
  }

  getWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  sendToRenderer(channel: string, ...args: any[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args)
    }
  }
}
