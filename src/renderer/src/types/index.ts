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

export interface TcpConfig {
  host: string
  port: number
  timeout?: number
}

export interface TcpServerConfig {
  host: string
  localPort: number
}

export interface UdpConfig {
  host: string
  localPort: number
  remoteAddress?: string
  remotePort?: number
  broadcast?: boolean
}

export type ConnectionType = 'serial' | 'tcp-client' | 'tcp-server' | 'udp'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export interface DataItem {
  data: string
  timestamp: number
  direction?: 'send' | 'receive'
  remoteAddress?: string
  remotePort?: number
}

export interface Tab {
  id: string
  type: ConnectionType
  name: string
  status: ConnectionStatus
  config: SerialConfig | TcpConfig | TcpServerConfig | UdpConfig
  connectionId?: string
  receiveData: DataItem[]
  sendData: DataItem[]
  receiveCount: number
  sendCount: number
  receiveFormat: DataFormat
  sendFormat: DataFormat
  isCyclicSending: boolean
  cycleSendTimer?: ReturnType<typeof setTimeout> | null
  cycleSendTabId: string | null
  cycleSendSelectedIndices: number[]
  cycleSendDelays: number[]
  cycleSendPresets: string[]
  cycleSendFormats: DataFormat[]
  presets: string[]
  presetFormats: DataFormat[]
  presetDelays: number[]
  presetSelected: boolean[]
}

export type DataFormat = 'hex' | 'ascii' | 'mixed' | 'string'

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

export interface SerialOpenResult {
  success: boolean
  portId?: string
  config?: SerialConfig
  error?: string
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

export interface CycleSendManager {
  [tabId: string]: CycleSendData
}

export interface CycleSendData {
  isCyclicSending: boolean
  selectedIndices: number[]
  delays: number[]
  presets: string[]
  formats: DataFormat[]
  tabId: string
  timer?: ReturnType<typeof setTimeout> | null
}

export interface SerialAPI {
  list: () => Promise<SerialPortInfo[]>
  open: (config: SerialConfig) => Promise<SerialOpenResult>
  close: (portId: string) => Promise<{ success: boolean; error?: string }>
  send: (portId: string, data: string) => Promise<{ success: boolean; error?: string }>
  onData: (callback: (data: SerialData) => void) => void
  removeDataListener: () => void
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

export interface UdpAPI {
  start: (config: UdpConfig) => Promise<UdpStartResult>
  stop: (sessionId: string) => Promise<{ success: boolean; error?: string }>
  send: (sessionId: string, data: string, address: string, port: number) => Promise<{ success: boolean; error?: string }>
  onData: (callback: (data: UdpData) => void) => void
  removeDataListener: () => void
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

declare global {
  interface Window {
    electronAPI: ElectronAPI
    cycleSendManager: CycleSendManager
  }
}
