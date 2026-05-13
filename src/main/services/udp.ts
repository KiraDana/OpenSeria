import * as dgram from 'dgram'

export interface UdpConfig {
  host: string
  localPort: number
  broadcast?: boolean
}

export interface UdpData {
  sessionId: string
  type: 'data'
  data: string
  remoteAddress: string
  remotePort: number
  timestamp: number
}

type UdpDataCallback = (data: UdpData) => void

interface UdpSession {
  socket: dgram.Socket
  config: UdpConfig
}

export class UdpService {
  private static udpSessions: Map<string, UdpSession> = new Map()
  private static sessionCounter = 0

  static async start(config: UdpConfig, onData: UdpDataCallback): Promise<{ success: boolean; sessionId?: string; config?: UdpConfig; localPort?: number; error?: string }> {
    const sessionId = `udp_${++this.sessionCounter}`

    return new Promise((resolve, reject) => {
      try {
        const server = dgram.createSocket({
          type: config.broadcast ? 'udp4' : 'udp4',
          reuseAddr: true
        })

        server.on('error', (err: Error) => {
          console.error('UDP server error:', err)
          server.close()
          reject({ success: false, error: err.message })
        })

        server.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
          onData({
            sessionId,
            type: 'data',
            data: msg.toString('hex').toUpperCase(),
            remoteAddress: rinfo.address,
            remotePort: rinfo.port,
            timestamp: Date.now()
          })
        })

        server.on('listening', () => {
          if (config.broadcast) {
            server.setBroadcast(true)
          }

          this.udpSessions.set(sessionId, { socket: server, config })

          resolve({
            success: true,
            sessionId,
            config,
            localPort: config.localPort
          })
        })

        server.bind(config.localPort || 0, config.host || '0.0.0.0')
      } catch (error) {
        console.error('UDP start error:', error)
        reject({ success: false, error: (error as Error).message })
      }
    })
  }

  static stop(sessionId: string): { success: boolean; error?: string } {
    const session = this.udpSessions.get(sessionId)
    if (session) {
      try {
        session.socket.close()
        this.udpSessions.delete(sessionId)
        return { success: true }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
    return { success: false, error: 'Session not found' }
  }

  static send(sessionId: string, data: string, address: string, port: number): { success: boolean; error?: string } {
    const session = this.udpSessions.get(sessionId)
    if (session) {
      try {
        const buffer = Buffer.from(data, 'hex')
        session.socket.send(buffer, 0, buffer.length, port, address, (err) => {
          if (err) {
            console.error('UDP send error:', err)
          }
        })
        return { success: true }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
    return { success: false, error: 'Session not found' }
  }

  static closeAll(): void {
    for (const [, session] of this.udpSessions) {
      try {
        session.socket.close()
      } catch (e) { /* ignore */ }
    }
    this.udpSessions.clear()
  }
}
