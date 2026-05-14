import { ElMessage } from 'element-plus'
import type { Tab } from '@/types'
import { useSerial } from './useSerial'

export function useConnection() {
  const serial = useSerial()

  async function connect(tab: Tab): Promise<boolean> {
    try {
      const result = await serial.open(tab.config as any)

      if (result.success) {
        tab.connectionId = result.portId
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
      await serial.close(tab.connectionId)
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
      const result = await serial.send(tab.connectionId, data)

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
    connect,
    disconnect,
    send
  }
}
