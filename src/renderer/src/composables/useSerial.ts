import { ref, type Ref } from 'vue'
import type { SerialConfig, SerialPortInfo, SerialData, SerialOpenResult } from '@/types'

export function useSerial() {
  const availablePorts: Ref<SerialPortInfo[]> = ref([])
  const isRefreshing: Ref<boolean> = ref(false)

  async function listPorts(): Promise<SerialPortInfo[]> {
    isRefreshing.value = true
    try {
      const ports = await window.electronAPI.serial.list()
      availablePorts.value = ports || []
      return availablePorts.value
    } catch (error) {
      console.error('Failed to list ports:', error)
      availablePorts.value = []
      return []
    } finally {
      isRefreshing.value = false
    }
  }

  async function open(config: SerialConfig): Promise<SerialOpenResult> {
    return await window.electronAPI.serial.open(config)
  }

  async function close(portId: string): Promise<{ success: boolean; error?: string }> {
    return await window.electronAPI.serial.close(portId)
  }

  async function send(portId: string, data: string): Promise<{ success: boolean; error?: string }> {
    return await window.electronAPI.serial.send(portId, data)
  }

  function onData(callback: (data: SerialData) => void): void {
    window.electronAPI.serial.onData(callback)
  }

  function removeDataListener(): void {
    window.electronAPI.serial.removeDataListener()
  }

  return {
    availablePorts,
    isRefreshing,
    listPorts,
    open,
    close,
    send,
    onData,
    removeDataListener
  }
}
