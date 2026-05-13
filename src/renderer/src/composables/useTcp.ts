import type { TcpConfig, TcpServerConfig, TcpData, TcpClientData, TcpConnectResult, TcpServerResult } from '@/types'

export function useTcp() {
  async function connect(config: TcpConfig): Promise<TcpConnectResult> {
    return await window.electronAPI.tcp.connect(config)
  }

  async function disconnect(connectionId: string): Promise<{ success: boolean; error?: string }> {
    return await window.electronAPI.tcp.disconnect(connectionId)
  }

  async function send(connectionId: string, data: string): Promise<{ success: boolean; error?: string }> {
    return await window.electronAPI.tcp.send(connectionId, data)
  }

  async function startServer(config: TcpServerConfig): Promise<TcpServerResult> {
    return await window.electronAPI.tcp.startServer(config)
  }

  async function stopServer(serverId: string): Promise<{ success: boolean; error?: string }> {
    return await window.electronAPI.tcp.stopServer(serverId)
  }

  function onData(callback: (data: TcpData) => void): void {
    window.electronAPI.tcp.onData(callback)
  }

  function onClientData(callback: (data: TcpClientData) => void): void {
    window.electronAPI.tcp.onClientData(callback)
  }

  function removeDataListener(): void {
    window.electronAPI.tcp.removeDataListener()
  }

  return {
    connect,
    disconnect,
    send,
    startServer,
    stopServer,
    onData,
    onClientData,
    removeDataListener
  }
}
