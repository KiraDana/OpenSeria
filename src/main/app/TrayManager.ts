import { Tray, Menu, nativeImage, app } from 'electron'
import { join } from 'path'

export class TrayManager {
  private tray: Tray | null = null

  createTray(): void {
    const iconPath = join(app.isPackaged ? __dirname : join(__dirname, '../..'), 'src/assets/icon.ico')
    let icon: nativeImage

    try {
      icon = nativeImage.createFromPath(iconPath)
    } catch {
      icon = nativeImage.createEmpty()
    }

    this.tray = new Tray(icon)

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示窗口',
        click: () => {
          const windows = require('electron').BrowserWindow.getAllWindows()
          if (windows.length > 0) {
            windows[0].show()
          }
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          app.quit()
        }
      }
    ])

    this.tray.setToolTip('OpenSerial - KiraDana')
    this.tray.setContextMenu(contextMenu)

    this.tray.on('click', () => {
      const windows = require('electron').BrowserWindow.getAllWindows()
      if (windows.length > 0) {
        if (windows[0].isVisible()) {
          windows[0].hide()
        } else {
          windows[0].show()
        }
      }
    })
  }

  destroy(): void {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }
}
