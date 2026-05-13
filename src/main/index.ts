import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron'
import { join } from 'path'
import * as fs from 'fs'
import { WindowManager } from './app/WindowManager'
import { TrayManager } from './app/TrayManager'
import { SerialService } from './services/serial'
import { TcpService } from './services/tcp'
import { UdpService } from './services/udp'
import { ConfigService } from './services/config'
import { CrcUtils } from './utils/crc'

class MainApp {
  private windowManager: WindowManager
  private trayManager: TrayManager
  private configService: ConfigService

  constructor() {
    this.configService = new ConfigService()
    this.windowManager = new WindowManager(this.configService)
    this.trayManager = new TrayManager()
  }

  async init(): Promise<void> {
    this.setupIpcHandlers()
    await this.windowManager.createWindow()
    this.createMenu()
    this.trayManager.createTray()
  }

  private setupIpcHandlers(): void {
    ipcMain.handle('serial:list', async () => {
      return await SerialService.list()
    })

    ipcMain.handle('serial:open', async (_, config) => {
      return await SerialService.open(config, (data) => {
        this.windowManager.sendToRenderer('serial:data', data)
      })
    })

    ipcMain.handle('serial:close', async (_, portId) => {
      return SerialService.close(portId)
    })

    ipcMain.handle('serial:send', async (_, { portId, data }) => {
      return await SerialService.send(portId, data)
    })

    ipcMain.handle('tcp:connect', async (_, config) => {
      return await TcpService.connect(config, (data) => {
        this.windowManager.sendToRenderer('tcp:data', data)
      })
    })

    ipcMain.handle('tcp:disconnect', async (_, connectionId) => {
      return TcpService.disconnect(connectionId)
    })

    ipcMain.handle('tcp:send', async (_, { connectionId, data }) => {
      return TcpService.send(connectionId, data)
    })

    ipcMain.handle('tcp:server-start', async (_, config) => {
      return await TcpService.startServer(config, (data) => {
        this.windowManager.sendToRenderer('tcp:client-data', data)
      })
    })

    ipcMain.handle('tcp:server-stop', async (_, serverId) => {
      return TcpService.stopServer(serverId)
    })

    ipcMain.handle('udp:start', async (_, config) => {
      return await UdpService.start(config, (data) => {
        this.windowManager.sendToRenderer('udp:data', data)
      })
    })

    ipcMain.handle('udp:stop', async (_, sessionId) => {
      return UdpService.stop(sessionId)
    })

    ipcMain.handle('udp:send', async (_, { sessionId, data, address, port }) => {
      return UdpService.send(sessionId, data, address, port)
    })

    ipcMain.handle('config:get', async (_, key) => {
      return this.configService.get(key)
    })

    ipcMain.handle('config:set', async (_, key, value) => {
      return this.configService.set(key, value)
    })

    ipcMain.handle('crc:calculate', async (_, { data, type, byteOrder }) => {
      return CrcUtils.calculateCRC(data, type, byteOrder)
    })

    ipcMain.handle('data:save', async (_, { content, defaultName }) => {
      try {
        const userDataPath = app.getPath('userData')
        const dataDir = join(userDataPath, 'saved_data')
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true })
        }
        const defaultPath = join(dataDir, defaultName || `data_${Date.now()}.txt`)

        const result = await dialog.showSaveDialog(this.windowManager.getWindow()!, {
          title: '保存数据',
          defaultPath: defaultPath,
          filters: [
            { name: '文本文件', extensions: ['txt'] },
            { name: '所有文件', extensions: ['*'] }
          ],
          properties: ['createDirectory']
        })

        if (result.canceled) {
          return { success: false, canceled: true }
        }

        fs.writeFileSync(result.filePath!, content, 'utf-8')
        return { success: true, filePath: result.filePath }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })
  }

  private createMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: '文件',
        submenu: [
          {
            label: '新建标签',
            accelerator: 'CmdOrCtrl+T',
            click: () => this.windowManager.sendToRenderer('menu:new-tab')
          },
          {
            label: '关闭标签',
            accelerator: 'CmdOrCtrl+W',
            click: () => this.windowManager.sendToRenderer('menu:close-tab')
          },
          { type: 'separator' },
          {
            label: '退出',
            accelerator: 'CmdOrCtrl+Q',
            click: () => app.quit()
          }
        ]
      },
      {
        label: '编辑',
        submenu: [
          { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
          { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
          { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
          { type: 'separator' },
          {
            label: '清空接收区',
            click: () => this.windowManager.sendToRenderer('menu:clear-receive')
          },
          {
            label: '清空发送区',
            click: () => this.windowManager.sendToRenderer('menu:clear-send')
          }
        ]
      },
      {
        label: '视图',
        submenu: [
          { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
          { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
          { type: 'separator' },
          { label: '放大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
          { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
          { label: '重置缩放', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' }
        ]
      },
      {
        label: '帮助',
        submenu: [
          {
            label: '关于',
            click: () => this.windowManager.sendToRenderer('menu:about')
          }
        ]
      }
    ]

    Menu.setApplicationMenu(null)
  }
}

let mainApp: MainApp | null = null

app.whenReady().then(async () => {
  mainApp = new MainApp()
  await mainApp.init()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await mainApp!.init()
    }
  })
})

app.on('window-all-closed', () => {
  if (mainApp) {
    SerialService.closeAll()
    TcpService.closeAll()
    UdpService.closeAll()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
