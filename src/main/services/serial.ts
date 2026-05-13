import { SerialPort } from 'serialport'

export interface SerialConfig {
  port: string
  baudRate: number
  dataBits: number
  parity: string
  stopBits: number
  rtscts?: boolean
  xon?: boolean
  xoff?: boolean
}

export interface SerialPortInfo {
  path: string
  manufacturer?: string
  serialNumber?: string
  pnpId?: string
  locationId?: string
  friendlyName?: string
}

export interface SerialData {
  portId: string
  type: 'binary' | 'error' | 'disconnected'
  data: string
  timestamp: number
}

type DataCallback = (data: SerialData) => void

interface PortInfo {
  port: SerialPort
  config: SerialConfig
  onData: DataCallback
  isOpen: boolean
  error?: string
}

export class SerialService {
  private static ports: Map<string, PortInfo> = new Map()
  private static portCounter = 0

  private static log(...args: any[]): void {
    console.log('[Serial]', ...args)
  }

  private static error(...args: any[]): void {
    console.error('[Serial Error]', ...args)
  }

  static async list(): Promise<SerialPortInfo[]> {
    this.log('开始扫描串口...')
    try {
      const ports = await SerialPort.list()
      const portNames = ports.map(p => p.path)
      this.log('找到串口:', portNames)
      return ports as SerialPortInfo[]
    } catch (err) {
      this.error('扫描串口失败:', (err as Error).message)
      return []
    }
  }

  static async open(config: SerialConfig, onData: DataCallback): Promise<{ success: boolean; portId?: string; config?: SerialConfig; error?: string }> {
    const portId = `serial_${++this.portCounter}`
    this.log('尝试打开串口:', config.port)
    this.log('  波特率:', config.baudRate)
    this.log('  数据位:', config.dataBits)
    this.log('  校验位:', config.parity)
    this.log('  停止位:', config.stopBits)

    try {
      const availablePorts = await SerialPort.list()
      const portExists = availablePorts.find(p => p.path === config.port)
      if (!portExists) {
        const available = availablePorts.map(p => p.path).join(', ')
        this.error(`端口 ${config.port} 不存在。可用端口: ${available || '无'}`)
        return { success: false, error: `端口 ${config.port} 不存在。可用端口: ${available || '无'}` }
      }
      this.log('端口存在:', portExists)

      const port = new SerialPort({
        path: config.port,
        baudRate: parseInt(String(config.baudRate)) || 115200,
        dataBits: parseInt(String(config.dataBits)) || 8,
        parity: config.parity || 'none',
        stopBits: parseFloat(String(config.stopBits)) || 1,
        lock: false,
        autoOpen: false
      })

      const portInfo: PortInfo = {
        port,
        config,
        onData,
        isOpen: false
      }

      port.on('error', (err) => {
        this.error('串口错误:', err.message)
        portInfo.error = err.message
        portInfo.onData({
          portId,
          type: 'error',
          data: err.message,
          timestamp: Date.now()
        })
      })

      port.on('close', () => {
        this.log('串口已关闭:', config.port)
        this.log('  portInfo.isOpen:', portInfo.isOpen)
        this.log('  准备通知渲染进程...')
        if (portInfo.isOpen) {
          portInfo.isOpen = false
          portInfo.onData({
            portId,
            type: 'disconnected',
            data: '串口连接已断开',
            timestamp: Date.now()
          })
          this.log('  已通知渲染进程串口断开')
        } else {
          this.log('  端口未打开，无需通知')
        }
        this.log('  从 ports 中删除 portId:', portId)
        this.ports.delete(portId)
        this.log('  剩余端口数:', this.ports.size)
      })

      this.ports.set(portId, portInfo)

      await new Promise<void>((resolve, reject) => {
        port.open((err) => {
          if (err) {
            this.error('打开串口失败:', err.message)
            let errorMsg = err.message
            if (err.message.includes('Unknown error code 1') || err.message.includes('code 1')) {
              errorMsg = `无法打开 ${config.port}。可能原因：1) 端口被其他程序占用 2) 端口不存在 3) 需要管理员权限。请尝试以管理员身份运行或检查设备管理器。`
            } else if (err.message.includes('Access denied') || err.message.includes('already in use')) {
              errorMsg = `端口 ${config.port} 已被占用，请关闭其他应用程序`
            } else if (err.message.includes('File not found')) {
              errorMsg = `端口 ${config.port} 不存在`
            }
            this.ports.delete(portId)
            reject(new Error(errorMsg))
          } else {
            this.log('打开成功, portId:', portId)
            this.log('  port.isOpen:', port.isOpen)
            portInfo.isOpen = true
            resolve()
          }
        })
      })

      port.on('data', (buffer: Buffer) => {
        console.log('原始数据:', buffer, '长度:', buffer.length)
        const hex = buffer.toString('hex').toUpperCase()
        const hexWithSpace = hex.match(/.{1,2}/g)?.join(' ') || hex
        this.log('收到数据 (HEX):', hexWithSpace, '从端口:', config.port)
        portInfo.onData({
          portId,
          type: 'binary',
          data: hexWithSpace,
          timestamp: Date.now()
        })
      })

      this.log('数据监听器已注册')

      return { success: true, portId, config }
    } catch (err) {
      this.error('打开串口失败:', (err as Error).message)
      return { success: false, error: (err as Error).message }
    }
  }

  static close(portId: string): { success: boolean; error?: string } {
    const portInfo = this.ports.get(portId)
    if (portInfo) {
      try {
        this.log('关闭串口:', portId)
        portInfo.isOpen = false
        portInfo.port.close()
        this.ports.delete(portId)
        return { success: true }
      } catch (err) {
        this.error('关闭串口失败:', (err as Error).message)
        return { success: false, error: (err as Error).message }
      }
    }
    return { success: false, error: 'Port not found' }
  }

  static send(portId: string, data: string): { success: boolean; error?: string } | Promise<{ success: boolean; error?: string }> {
    this.log('发送数据, portId:', portId, 'available ports:', Array.from(this.ports.keys()))

    const portInfo = this.ports.get(portId)
    if (!portInfo) {
      this.error('端口未找到:', portId, '可用端口:', Array.from(this.ports.keys()))
      return { success: false, error: 'Port not found: ' + portId }
    }

    const port = portInfo.port
    if (!port || !port.isOpen) {
      this.error('端口未打开或已关闭:', portId)
      return { success: false, error: 'Port is not open' }
    }

    try {
      this.log('发送数据:', data, 'hex length:', data.length)
      const buffer = Buffer.from(data, 'hex')
      this.log('Buffer长度:', buffer.length, 'Buffer:', buffer.toString('hex'))

      return new Promise((resolve) => {
        port.write(buffer, (err) => {
          if (err) {
            this.error('串口写入错误:', err.message)
            resolve({ success: false, error: err.message })
          } else {
            this.log('串口写入完成')
            resolve({ success: true })
          }
        })
      })
    } catch (err) {
      this.error('发送失败:', (err as Error).message)
      return { success: false, error: (err as Error).message }
    }
  }

  static closeAll(): void {
    for (const [portId, portInfo] of this.ports) {
      try {
        portInfo.port.close()
      } catch (e) {
        // ignore
      }
    }
    this.ports.clear()
  }
}
