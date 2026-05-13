import type { UdpConfig, UdpData, UdpStartResult } from '@/types'

export function useUdp() {
  async function start(config: UdpConfig): Promise<UdpStartResult> {
    return await window.electronAPI.udp.start(config)
  }

  async function stop(sessionId: string): Promise<{ success: boolean; error?: string }> {
    return await window.electronAPI.udp.stop(sessionId)
  }

  async function send(sessionId: string, data: string, address: string, port: number): Promise<{ success: boolean; error?: string }> {
    return await window.electronAPI.udp.send(sessionId, data, address, port)
  }

  function onData(callback: (data: UdpData) => void): void {
    window.electronAPI.udp.onData(callback)
  }

  function removeDataListener(): void {
    window.electronAPI.udp.removeDataListener()
  }

  return {
    start,
    stop,
    send,
    onData,
    removeDataListener
  }
}
