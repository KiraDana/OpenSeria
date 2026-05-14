import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { Tab, ConnectionType, ConnectionStatus, DataItem, SerialConfig, DataFormat } from '@/types'

let tabCounter = 0

export function useTabs() {
  const tabs: Ref<Tab[]> = ref([])
  const activeTabId: Ref<string | null> = ref(null)

  const activeTab: ComputedRef<Tab | undefined> = computed(() => {
    return tabs.value.find(t => t.id === activeTabId.value)
  })

  function createNewTab(type: ConnectionType = 'serial'): Tab {
    tabCounter++
    const id = `tab_${tabCounter}`

    const newTab: Tab = {
      id,
      type,
      name: `窗口${tabCounter}`,
      status: 'disconnected',
      config: getDefaultConfig(type),
      receiveData: [],
      sendData: [],
      receiveCount: 0,
      sendCount: 0,
      receiveFormat: 'hex',
      sendFormat: 'hex',
      isCyclicSending: false,
      cycleSendTimer: null,
      cycleSendTabId: null,
      cycleSendSelectedIndices: [],
      cycleSendDelays: [],
      cycleSendPresets: [],
      cycleSendFormats: [],
      presets: Array(99).fill(''),
      presetFormats: Array(99).fill('hex'),
      presetDelays: Array(99).fill(0),
      presetSelected: Array(99).fill(false),
      showTimestamp: true,
      presetCollapsed: true
    }

    tabs.value.push(newTab)
    activeTabId.value = id

    return newTab
  }

  function getDefaultConfig(type: ConnectionType): SerialConfig {
    return {
      port: '',
      baudRate: 115200,
      dataBits: 8,
      parity: 'none',
      stopBits: 1
    }
  }

  function closeTab(tabId: string): void {
    const index = tabs.value.findIndex(t => t.id === tabId)
    if (index !== -1) {
      tabs.value.splice(index, 1)

      for (let i = 0; i < tabs.value.length; i++) {
        tabs.value[i].id = `tab_${i + 1}`
        tabs.value[i].name = `窗口${i + 1}`
      }
      tabCounter = tabs.value.length

      if (activeTabId.value === tabId) {
        activeTabId.value = tabs.value.length > 0 ? tabs.value[tabs.value.length - 1].id : null
      }
    }
  }

  function setActiveTab(tabId: string): void {
    activeTabId.value = tabId
  }

  function updateTabConfig<T extends Record<string, any>>(tabId: string, config: Partial<T>): void {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.config = { ...tab.config, ...config } as any
    }
  }

  function updateTabStatus(tabId: string, status: ConnectionStatus, connectionId?: string): void {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.status = status
      if (connectionId !== undefined) {
        tab.connectionId = connectionId
      }
    }
  }

  function addReceiveData(tabId: string, item: DataItem): void {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.receiveData.push(item)
      if (tab.receiveData.length > 1000) {
        tab.receiveData = tab.receiveData.slice(-500)
      }
    }
  }

  function addSendData(tabId: string, item: DataItem): void {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.sendData.push(item)
    }
  }

  function updateReceiveCount(tabId: string, count: number): void {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.receiveCount = count
    }
  }

  function updateSendCount(tabId: string, count: number): void {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.sendCount = count
    }
  }

  function clearReceiveData(tabId: string): void {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.receiveData = []
      tab.receiveCount = 0
    }
  }

  function clearSendData(tabId: string): void {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.sendData = []
      tab.sendCount = 0
    }
  }

  function updateDataFormat(tabId: string, type: 'receive' | 'send', format: DataFormat): void {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      if (type === 'receive') {
        tab.receiveFormat = format
      } else {
        tab.sendFormat = format
      }
    }
  }

  function setCyclicSending(tabId: string, isCyclic: boolean): void {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.isCyclicSending = isCyclic
    }
  }

  function updatePresets(tabId: string, presets: string[], formats: DataFormat[], delays: number[], selected: boolean[]): void {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.presets = presets
      tab.presetFormats = formats
      tab.presetDelays = delays
      tab.presetSelected = selected
    }
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    createNewTab,
    closeTab,
    setActiveTab,
    updateTabConfig,
    updateTabStatus,
    addReceiveData,
    addSendData,
    updateReceiveCount,
    updateSendCount,
    clearReceiveData,
    clearSendData,
    updateDataFormat,
    setCyclicSending,
    updatePresets
  }
}
