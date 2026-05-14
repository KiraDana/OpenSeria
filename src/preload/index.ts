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
  savePreset: (data: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>
  loadPreset: () => Promise<{ success: boolean; data?: string; canceled?: boolean; error?: string }>
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

const utilAPI: UtilAPI = {
  openExternal: (url) => ipcRenderer.invoke('util:open-external', url),
  savePreset: (data) => ipcRenderer.invoke('util:save-preset', data),
  loadPreset: () => ipcRenderer.invoke('util:load-preset')
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
  config: configAPI,
  util: utilAPI,
  crc: crcAPI,
  data: dataAPI,
  menu: menuAPI
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
