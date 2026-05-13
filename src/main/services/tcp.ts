import * as net from 'net'

export interface TcpConfig {
  host: string
  port: number
  timeout?: number
}

export interface TcpServerConfig {
  host: string
  localPort: number
}

export interface TcpData {
  connectionId?: string
  serverId?: string
  clientId?: string
  type: 'data' | 'error' | 'close' | 'timeout'
  data?: string
  error?: string
  remoteAddress?: string
  remotePort?: number
  timestamp: number
}

type TcpDataCallback = (data: TcpData) => void

interface TcpConnection {
  socket: net.Socket
  config: TcpConfig
}

interface TcpServer {
  server: net.Server
  config: TcpServerConfig
  clients: Map<string, net.Socket>
}

export class TcpService {
  private static tcpConnections: Map<string, TcpConnection> = new Map()
  private static tcpServers: Map<string, TcpServer> = new Map()
  private static connectionCounter = 0
  private static serverCounter = 0

  static async connect(config: TcpConfig, onData: TcpDataCallback): Promise<{ success: boolean; connectionId?: string; config?: TcpConfig; remoteAddress?: string; remotePort?: number; error?: string }> {
    const connectionId = `tcp_${++this.connectionCounter}`

    return new Promise((resolve) => {
      const socket = new net.Socket()

      socket.connect(config.port, config.host, () => {
        this.tcpConnections.set(connectionId, { socket, config })

        resolve({
          success: true,
          connectionId,
          config,
          remoteAddress: config.host,
          remotePort: config.port
        })
      })

      socket.on('data', (data: Buffer) => {
        onData({
          connectionId,
          type: 'data',
          data: data.toString('hex').toUpperCase(),
          timestamp: Date.now()
        })
      })

      socket.on('error', (err: Error) => {
        console.error('TCP connection error:', err)
        onData({
          connectionId,
          type: 'error',
          error: err.message,
          timestamp: Date.now()
        })
      })

      socket.on('close', () => {
        this.tcpConnections.delete(connectionId)
        onData({
          connectionId,
          type: 'close',
          timestamp: Date.now()
        })
      })

      socket.on('timeout', () => {
        onData({
          connectionId,
          type: 'timeout',
          timestamp: Date.now()
        })
      })

      socket.setTimeout(config.timeout || 30000)
    })
  }

  static disconnect(connectionId: string): { success: boolean; error?: string } {
    const conn = this.tcpConnections.get(connectionId)
    if (conn) {
      try {
        conn.socket.destroy()
        this.tcpConnections.delete(connectionId)
        return { success: true }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
    return { success: false, error: 'Connection not found' }
  }

  static send(connectionId: string, data: string): { success: boolean; error?: string } {
    const conn = this.tcpConnections.get(connectionId)
    if (conn) {
      try {
        const buffer = Buffer.from(data, 'hex')
        conn.socket.write(buffer)
        return { success: true }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
    return { success: false, error: 'Connection not found' }
  }

  static async startServer(config: TcpServerConfig, onData: TcpDataCallback): Promise<{ success: boolean; serverId?: string; config?: TcpServerConfig; localPort?: number; error?: string }> {
    const serverId = `tcp_server_${++this.serverCounter}`

    return new Promise((resolve, reject) => {
      const server = net.createServer((socket: net.Socket) => {
        const clientId = `${serverId}_client_${socket.remoteAddress}:${socket.remotePort}`

        socket.on('data', (data: Buffer) => {
          onData({
            serverId,
            clientId,
            type: 'data',
            data: data.toString('hex').toUpperCase(),
            remoteAddress: socket.remoteAddress,
            remotePort: socket.remotePort,
            timestamp: Date.now()
          })
        })

        socket.on('error', (err: Error) => {
          onData({
            serverId,
            clientId,
            type: 'error',
            error: err.message,
            timestamp: Date.now()
          })
        })

        socket.on('close', () => {
          onData({
            serverId,
            clientId,
            type: 'close',
            timestamp: Date.now()
          })
        })
      })

      server.on('error', (err: Error) => {
        console.error('TCP server error:', err)
        reject({ success: false, error: err.message })
      })

      server.listen(config.localPort, config.host || '0.0.0.0', () => {
        this.tcpServers.set(serverId, { server, config, clients: new Map() })
        resolve({
          success: true,
          serverId,
          config,
          localPort: config.localPort
        })
      })
    })
  }

  static stopServer(serverId: string): { success: boolean; error?: string } {
    const srv = this.tcpServers.get(serverId)
    if (srv) {
      try {
        srv.server.close()
        this.tcpServers.delete(serverId)
        return { success: true }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
    return { success: false, error: 'Server not found' }
  }

  static closeAll(): void {
    for (const [, conn] of this.tcpConnections) {
      try {
        conn.socket.destroy()
      } catch (e) { /* ignore */ }
    }
    this.tcpConnections.clear()

    for (const [, srv] of this.tcpServers) {
      try {
        srv.server.close()
      } catch (e) { /* ignore */ }
    }
    this.tcpServers.clear()
  }
}
