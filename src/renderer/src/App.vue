<template>
  <div class="app-container">
    <Toolbar />
    <TabBar
      :tabs="tabs"
      :active-tab="activeTabId"
      @tab-change="setActiveTab"
      @tab-close="handleTabClose"
      @add-tab="handleNewTab"
    />

    <div class="main-content">
      <div class="left-panel">
        <ConnectionPanel
          :tab="activeTab"
          :connection-status="currentConnectionStatus"
          @connect="handleConnect"
          @disconnect="handleDisconnect"
        />
      </div>
      <div class="right-panel">
        <DataPanel
          :tab="activeTab"
          @send="handleSend"
          @clear-receive="handleClearReceive"
          @clear-send="handleClearSend"
          @update-format="handleUpdateFormat"
          @show-error="handleShowError"
        />
      </div>
    </div>

    <StatusBar
      :tab="activeTab"
      :connection-status="currentConnectionStatus"
      :error-message="currentErrorMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Toolbar, TabBar, ConnectionPanel, DataPanel, StatusBar } from '@/components'
import { useTabs, useConnection } from '@/composables'
import type { Tab, ConnectionType, ConnectionStatus, DataFormat, SerialConfig, TcpConfig, TcpServerConfig, UdpConfig, DataItem } from '@/types'

const {
  tabs,
  activeTabId,
  activeTab,
  createNewTab,
  closeTab,
  setActiveTab,
  updateTabConfig,
  updateTabStatus,
  addReceiveData,
  updateReceiveCount,
  updateSendCount,
  clearReceiveData,
  clearSendData,
  updateDataFormat,
  setCyclicSending
} = useTabs()

const { connect, disconnect, send: sendData } = useConnection()

const currentErrorMessage = ref('')

const currentConnectionStatus = computed<ConnectionStatus>(() => {
  if (!activeTab.value) return 'disconnected'
  return activeTab.value.status || 'disconnected'
})

function handleNewTab(type: ConnectionType = 'serial'): void {
  createNewTab(type)
}

function handleTabClose(tabId: string): void {
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab && tab.status === 'connected') {
    disconnect(tab)
  }
  closeTab(tabId)
}

async function handleConnect(config: SerialConfig | TcpConfig | TcpServerConfig | UdpConfig): Promise<void> {
  const tab = activeTab.value
  if (!tab) return

  updateTabConfig(tab.id, config)

  const success = await connect(tab)
  if (success) {
    currentErrorMessage.value = ''
  }
}

async function handleDisconnect(): Promise<void> {
  const tab = activeTab.value
  if (!tab) return

  setCyclicSending(tab.id, false)
  await disconnect(tab)
}

async function handleSend(data: string, fromTabId?: string): Promise<void> {
  let tab: Tab | undefined
  if (fromTabId) {
    tab = tabs.value.find(t => t.id === fromTabId)
  }
  if (!tab) {
    tab = activeTab.value
  }

  if (!tab || tab.status !== 'connected' || !tab.connectionId) {
    ElMessage.warning('请先建立连接')
    return
  }

  const success = await sendData(tab, data)

  if (success) {
    const count = data.replace(/\s/g, '').length / 2
    tab.sendCount += count

    const sendItem: DataItem = {
      data,
      timestamp: Date.now(),
      direction: 'send'
    }
    addReceiveData(tab.id, sendItem)

    const receiveItem: DataItem = {
      data,
      timestamp: Date.now()
    }
    tab.receiveData.push(receiveItem)
    updateReceiveCount(tab.id, tab.receiveCount)
  } else {
    setCyclicSending(tab.id, false)
    const errorMsg = '发送失败，循环发送已停止'
    currentErrorMessage.value = errorMsg
    ElMessage.error(errorMsg)
  }
}

function handleShowError(message: string): void {
  currentErrorMessage.value = message
  ElMessage.error(message)
}

function handleClearReceive(): void {
  const tab = activeTab.value
  if (tab) {
    clearReceiveData(tab.id)
  }
}

function handleClearSend(): void {
  const tab = activeTab.value
  if (tab) {
    clearSendData(tab.id)
  }
}

function handleUpdateFormat(payload: { type: 'receive' | 'send'; format: DataFormat }): void {
  const tab = activeTab.value
  if (tab) {
    updateDataFormat(tab.id, payload.type, payload.format)
  }
}

function setupDataListeners(): void {
  window.electronAPI.serial.onData((data) => {
    const tab = tabs.value.find(t => t.type === 'serial' && t.connectionId === data.portId)

    if (data.type === 'error' || data.type === 'disconnected') {
      if (tab) {
        setCyclicSending(tab.id, false)
        updateTabStatus(tab.id, 'disconnected', undefined)
        currentErrorMessage.value = '串口连接断开: ' + data.data
        ElMessage.error('串口连接断开: ' + data.data)
      }
      return
    }

    if (tab) {
      addReceiveData(tab.id, {
        data: data.data,
        timestamp: data.timestamp
      })
      const count = data.data.replace(/\s/g, '').length / 2
      updateReceiveCount(tab.id, tab.receiveCount + count)
    }
  })

  window.electronAPI.tcp.onData((data) => {
    const tab = tabs.value.find(t => t.type === 'tcp-client' && t.connectionId === data.connectionId)
    if (tab) {
      addReceiveData(tab.id, {
        data: data.data || '',
        timestamp: data.timestamp
      })
      const count = (data.data || '').replace(/\s/g, '').length / 2
      updateReceiveCount(tab.id, tab.receiveCount + count)
    }
  })

  window.electronAPI.tcp.onClientData((data) => {
    const tab = tabs.value.find(t => t.type === 'tcp-server' && t.connectionId === data.serverId)
    if (tab) {
      addReceiveData(tab.id, {
        data: data.data || '',
        timestamp: data.timestamp,
        remoteAddress: data.remoteAddress,
        remotePort: data.remotePort
      })
      const count = (data.data || '').replace(/\s/g, '').length / 2
      updateReceiveCount(tab.id, tab.receiveCount + count)
    }
  })

  window.electronAPI.udp.onData((data) => {
    const tab = tabs.value.find(t => t.type === 'udp' && t.connectionId === data.sessionId)
    if (tab) {
      addReceiveData(tab.id, {
        data: data.data,
        timestamp: data.timestamp,
        remoteAddress: data.remoteAddress,
        remotePort: data.remotePort
      })
      const count = data.data.replace(/\s/g, '').length / 2
      updateReceiveCount(tab.id, tab.receiveCount + count)
    }
  })
}

function setupMenuListeners(): void {
  window.electronAPI.menu.onNewTab(() => {
    handleNewTab('serial')
  })

  window.electronAPI.menu.onCloseTab(() => {
    if (activeTabId.value) {
      handleTabClose(activeTabId.value)
    }
  })

  window.electronAPI.menu.onClearReceive(() => {
    handleClearReceive()
  })

  window.electronAPI.menu.onClearSend(() => {
    handleClearSend()
  })

  window.electronAPI.menu.onAbout(() => {
    ElMessage.info('OpenSerial - 串口以太网通讯测试工具 v1.0.0')
  })
}

onMounted(() => {
  createNewTab('serial')
  setupDataListeners()
  setupMenuListeners()
})

onUnmounted(() => {
  window.electronAPI.serial.removeDataListener()
  window.electronAPI.tcp.removeDataListener()
  window.electronAPI.udp.removeDataListener()
})

defineOptions({
  name: 'App'
})
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--primary-bg);
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel {
  width: 280px;
  min-width: 200px;
  max-width: 500px;
  border-right: 1px solid var(--border-color);
  background-color: var(--secondary-bg);
  overflow-y: auto;
  flex-shrink: 0;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}
</style>
