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

export type ConnectionType = 'serial'

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
  config: SerialConfig
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
  showTimestamp: boolean
  presetCollapsed: boolean
}

export type DataFormat = 'hex' | 'ascii'

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

export interface UtilAPI {
  openExternal: (url: string) => Promise<void>
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
  config: ConfigAPI
  util: UtilAPI
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
