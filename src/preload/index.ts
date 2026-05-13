import { contextBridge, ipcRenderer } from 'electron'

export interface SerialAPI {
  list: () => Promise<SerialPortInfo[]>
  open: (config: SerialConfig) => Promise<SerialOpenResult>
  close: (portId: string) => Promise<{ success: boolean; error?: string }>
  send: (portId: string, data: string) => Promise<{ success: boolean; error?: string }>
  onData: (callback: (data: SerialData) => void) => void
  removeDataListener: () => void
}

export interface SerialPortInfo {
  path: string
  manufacturer?: string
  serialNumber?: string
  pnpId?: string
  locationId?: string
  friendlyName?: string
}

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

export interface SerialData {
  portId: string
  type: 'binary' | 'error' | 'disconnected'
  data: string
  timestamp: number
}

export interface SerialOpenResult {
  success: boolean
  portId?: string
  config?: SerialConfig
  error?: string
}

export interface TcpAPI {
  connect: (config: TcpConfig) => Promise<TcpConnectResult>
  disconnect: (connectionId: string) => Promise<{ success: boolean; error?: string }>
  send: (connectionId: string, data: string) => Promise<{ success: boolean; error?: string }>
  startServer: (config: TcpServerConfig) => Promise<TcpServerResult>
  stopServer: (serverId: string) => Promise<{ success: boolean; error?: string }>
  onData: (callback: (data: TcpData) => void) => void
  onClientData: (callback: (data: TcpClientData) => void) => void
  removeDataListener: () => void
}

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
  connectionId: string
  type: 'data' | 'error' | 'close' | 'timeout'
  data?: string
  error?: string
  timestamp: number
}

export interface TcpClientData {
  serverId: string
  clientId: string
  type: 'data' | 'error' | 'close'
  data?: string
  error?: string
  remoteAddress?: string
  remotePort?: number
  timestamp: number
}

export interface TcpConnectResult {
  success: boolean
  connectionId?: string
  config?: TcpConfig
  remoteAddress?: string
  remotePort?: number
  error?: string
}

export interface TcpServerResult {
  success: boolean
  serverId?: string
  config?: TcpServerConfig
  localPort?: number
  error?: string
}

export interface UdpAPI {
  start: (config: UdpConfig) => Promise<UdpStartResult>
  stop: (sessionId: string) => Promise<{ success: boolean; error?: string }>
  send: (sessionId: string, data: string, address: string, port: number) => Promise<{ success: boolean; error?: string }>
  onData: (callback: (data: UdpData) => void) => void
  removeDataListener: () => void
}

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

export interface UdpStartResult {
  success: boolean
  sessionId?: string
  config?: UdpConfig
  localPort?: number
  error?: string
}

export interface ConfigAPI {
  get: (key?: string) => Promise<any>
  set: (key: string, value: any) => Promise<{ success: boolean; error?: string }>
}

export interface CrcAPI {
  calculate: (data: string, type: string, byteOrder?: string) => Promise<string>
}

export interface DataAPI {
  save: (content: string, defaultName?: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>
}

export interface MenuAPI {
  onNewTab: (callback: () => void) => void
  onCloseTab: (callback: () => void) => void
  onClearReceive: (callback: () => void) => void
  onClearSend: (callback: () => void) => void
  onAbout: (callback: () => void) => void
}

export interface ElectronAPI {
  serial: SerialAPI
  tcp: TcpAPI
  udp: UdpAPI
  config: ConfigAPI
  crc: CrcAPI
  data: DataAPI
  menu: MenuAPI
}

const serialAPI: SerialAPI = {
  list: () => ipcRenderer.invoke('serial:list'),
  open: (config) => ipcRenderer.invoke('serial:open', config),
  close: (portId) => ipcRenderer.invoke('serial:close', portId),
  send: (portId, data) => ipcRenderer.invoke('serial:send', { portId, data }),
  onData: (callback) => {
    ipcRenderer.on('serial:data', (_, data) => callback(data))
  },
  removeDataListener: () => {
    ipcRenderer.removeAllListeners('serial:data')
  }
}

const tcpAPI: TcpAPI = {
  connect: (config) => ipcRenderer.invoke('tcp:connect', config),
  disconnect: (connectionId) => ipcRenderer.invoke('tcp:disconnect', connectionId),
  send: (connectionId, data) => ipcRenderer.invoke('tcp:send', { connectionId, data }),
  startServer: (config) => ipcRenderer.invoke('tcp:server-start', config),
  stopServer: (serverId) => ipcRenderer.invoke('tcp:server-stop', serverId),
  onData: (callback) => {
    ipcRenderer.on('tcp:data', (_, data) => callback(data))
  },
  onClientData: (callback) => {
    ipcRenderer.on('tcp:client-data', (_, data) => callback(data))
  },
  removeDataListener: () => {
    ipcRenderer.removeAllListeners('tcp:data')
    ipcRenderer.removeAllListeners('tcp:client-data')
  }
}

const udpAPI: UdpAPI = {
  start: (config) => ipcRenderer.invoke('udp:start', config),
  stop: (sessionId) => ipcRenderer.invoke('udp:stop', sessionId),
  send: (sessionId, data, address, port) => ipcRenderer.invoke('udp:send', { sessionId, data, address, port }),
  onData: (callback) => {
    ipcRenderer.on('udp:data', (_, data) => callback(data))
  },
  removeDataListener: () => {
    ipcRenderer.removeAllListeners('udp:data')
  }
}

const configAPI: ConfigAPI = {
  get: (key) => ipcRenderer.invoke('config:get', key),
  set: (key, value) => ipcRenderer.invoke('config:set', key, value)
}

const crcAPI: CrcAPI = {
  calculate: (data, type, byteOrder) => ipcRenderer.invoke('crc:calculate', { data, type, byteOrder })
}

const dataAPI: DataAPI = {
  save: (content, defaultName) => ipcRenderer.invoke('data:save', { content, defaultName })
}

const menuAPI: MenuAPI = {
  onNewTab: (callback) => ipcRenderer.on('menu:new-tab', () => callback()),
  onCloseTab: (callback) => ipcRenderer.on('menu:close-tab', () => callback()),
  onClearReceive: (callback) => ipcRenderer.on('menu:clear-receive', () => callback()),
  onClearSend: (callback) => ipcRenderer.on('menu:clear-send', () => callback()),
  onAbout: (callback) => ipcRenderer.on('menu:about', () => callback())
}

const electronAPI: ElectronAPI = {
  serial: serialAPI,
  tcp: tcpAPI,
  udp: udpAPI,
  config: configAPI,
  crc: crcAPI,
  data: dataAPI,
  menu: menuAPI
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
