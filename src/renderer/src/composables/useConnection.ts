import { ElMessage } from 'element-plus'
import type { Tab, ConnectionType, DataFormat } from '@/types'
import { useSerial } from './useSerial'
import { useTcp } from './useTcp'
import { useUdp } from './useUdp'

export function useConnection() {
  const serial = useSerial()
  const tcp = useTcp()
  const udp = useUdp()

  async function connect(tab: Tab): Promise<boolean> {
    try {
      let result: any

      switch (tab.type) {
        case 'serial':
          result = await serial.open(tab.config as any)
          break
        case 'tcp-client':
          result = await tcp.connect(tab.config as any)
          break
        case 'tcp-server':
          result = await tcp.startServer(tab.config as any)
          break
        case 'udp':
          result = await udp.start(tab.config as any)
          break
        default:
          ElMessage.error('不支持的连接类型')
          return false
      }

      if (result.success) {
        tab.connectionId = result.portId || result.connectionId || result.sessionId || result.serverId
        tab.status = 'connected'
        ElMessage.success('连接成功')
        return true
      } else {
        ElMessage.error(result.error || '连接失败')
        return false
      }
    } catch (error) {
      ElMessage.error('连接失败: ' + (error as Error).message)
      return false
    }
  }

  async function disconnect(tab: Tab): Promise<void> {
    if (!tab.connectionId) return

    try {
      let result: any

      switch (tab.type) {
        case 'serial':
          result = await serial.close(tab.connectionId)
          break
        case 'tcp-client':
          result = await tcp.disconnect(tab.connectionId)
          break
        case 'tcp-server':
          result = await tcp.stopServer(tab.connectionId)
          break
        case 'udp':
          result = await udp.stop(tab.connectionId)
          break
      }

      tab.status = 'disconnected'
      tab.connectionId = undefined
      ElMessage.success('已断开连接')
    } catch (error) {
      ElMessage.error('断开连接失败: ' + (error as Error).message)
    }
  }

  async function send(tab: Tab, data: string): Promise<boolean> {
    if (tab.status !== 'connected' || !tab.connectionId) {
      ElMessage.warning('请先建立连接')
      return false
    }

    try {
      let result: any

      switch (tab.type) {
        case 'serial':
          result = await serial.send(tab.connectionId, data)
          break
        case 'tcp-client':
        case 'tcp-server':
          result = await tcp.send(tab.connectionId, data)
          break
        case 'udp':
          const udpConfig = tab.config as any
          result = await udp.send(
            tab.connectionId,
            data,
            udpConfig.remoteAddress,
            udpConfig.remotePort
          )
          break
      }

      if (result.success) {
        return true
      } else {
        ElMessage.error('发送失败: ' + result.error)
        return false
      }
    } catch (error) {
      ElMessage.error('发送失败: ' + (error as Error).message)
      return false
    }
  }

  return {
    serial,
    tcp,
    udp,
    connect,
    disconnect,
    send
  }
}
