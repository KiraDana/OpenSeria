import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { Tab, DataFormat, CycleSendData } from '@/types'

interface UseCyclicSendOptions {
  getTab: () => Tab | undefined
  sendData: (data: string) => Promise<boolean>
  onError: (message: string) => void
}

export function useCyclicSend(options: UseCyclicSendOptions) {
  const { getTab, sendData, onError } = options

  const cyclicUpdateTrigger: Ref<number> = ref(0)
  let cyclicWorker: Worker | null = null

  const isCyclicSending: ComputedRef<boolean> = computed(() => {
    cyclicUpdateTrigger.value
    const tab = getTab()
    return tab?.isCyclicSending || false
  })

  function getWorker(): Worker | null {
    if (!cyclicWorker && typeof Worker !== 'undefined') {
      const workerPath = window.location.origin === 'file://'
        ? './cyclicSendWorker.js'
        : '/cyclicSendWorker.js'
      try {
        cyclicWorker = new Worker(workerPath)
        cyclicWorker.onmessage = handleWorkerMessage
      } catch (e) {
        console.error('Failed to create worker:', e)
      }
    }
    return cyclicWorker
  }

  function handleWorkerMessage(e: MessageEvent): void {
    const { type, index, tabId } = e.data
    if (type === 'tick') {
      const manager = window.cycleSendManager || {}
      const data = manager[tabId]
      if (data?.isCyclicSending) {
        sendPresetByIndex(index, tabId)
        const worker = getWorker()
        if (worker) {
          worker.postMessage({ type: 'continue', tabId })
        }
      }
    }
  }

  function startCyclicSend(
    selectedIndices: number[],
    presets: string[],
    formats: DataFormat[],
    delays: number[]
  ): void {
    const tab = getTab()
    if (!tab) return

    window.cycleSendManager = window.cycleSendManager || {}
    window.cycleSendManager[tab.id] = {
      isCyclicSending: true,
      selectedIndices,
      delays,
      presets: [...presets],
      formats: [...formats],
      tabId: tab.id
    }

    tab.isCyclicSending = true
    cyclicUpdateTrigger.value++
    sendNextPreset(-1, tab.id)
  }

  function stopCyclicSend(tabId: string): void {
    const manager = window.cycleSendManager || {}
    const data = manager[tabId]

    const worker = getWorker()
    if (worker) {
      worker.postMessage({ type: 'stop', tabId })
    }

    if (data?.timer) {
      clearTimeout(data.timer)
      data.timer = null
    }
    if (data) {
      data.isCyclicSending = false
    }

    const tab = getTab()
    if (tab && tab.id === tabId) {
      tab.isCyclicSending = false
    }

    cyclicUpdateTrigger.value++
  }

  function toggleCyclicSending(
    selectedIndices: number[],
    presets: string[],
    formats: DataFormat[],
    delays: number[]
  ): void {
    const tab = getTab()
    if (!tab) return

    const manager = window.cycleSendManager || {}
    const currentData = manager[tab.id]
    const currentTabCyclic = currentData?.isCyclicSending || tab.isCyclicSending || false

    if (currentTabCyclic) {
      stopCyclicSend(tab.id)
    } else {
      startCyclicSend(selectedIndices, presets, formats, delays)
    }
  }

  async function sendPresetByIndex(index: number, tabId: string): Promise<void> {
    const manager = window.cycleSendManager || {}
    const data = manager[tabId]

    const tab = getTab()
    if (!tab || tab.status !== 'connected' || !tab.connectionId) {
      stopCyclicSend(tabId)
      onError('连接已断开，循环发送已停止')
      return
    }

    const presetsData = data?.presets || []
    const formatsData = data?.formats || []

    const presetData = presetsData[index]
    const format = formatsData[index]
    if (presetData) {
      let dataToSend = presetData
      if (format === 'hex') {
        dataToSend = presetData.replace(/\s/g, '')
      } else {
        const arr: string[] = []
        for (let i = 0; i < presetData.length; i++) {
          arr.push(presetData.charCodeAt(i).toString(16).padStart(2, '0'))
        }
        dataToSend = arr.join('')
      }
      await sendData(dataToSend)
    }
  }

  function sendNextPreset(currentIndex: number, tabId: string): void {
    const manager = window.cycleSendManager || {}
    const data = manager[tabId]

    if (!data?.isCyclicSending) {
      return
    }

    const selectedIndices = data.selectedIndices || []
    const delays = data.delays || []

    if (selectedIndices.length === 0) {
      stopCyclicSend(tabId)
      return
    }

    const currentPos = selectedIndices.indexOf(currentIndex)
    let nextPos = currentPos + 1

    if (nextPos >= selectedIndices.length) {
      nextPos = 0
    }

    const nextIndex = selectedIndices[nextPos]
    const delay = delays[nextPos] || 0

    const worker = getWorker()
    if (worker) {
      worker.postMessage({
        type: 'start',
        delay,
        index: nextIndex,
        tabId,
        selectedIndices,
        delays
      })
    } else {
      data.timer = setTimeout(() => {
        const m = window.cycleSendManager || {}
        const d = m[tabId]
        if (d?.isCyclicSending) {
          sendPresetByIndex(nextIndex, tabId)
          sendNextPreset(nextIndex, tabId)
        }
      }, delay)
    }
  }

  function cleanup(): void {
    if (cyclicWorker) {
      cyclicWorker.terminate()
      cyclicWorker = null
    }
  }

  return {
    isCyclicSending,
    cyclicUpdateTrigger,
    startCyclicSend,
    stopCyclicSend,
    toggleCyclicSending,
    sendPresetByIndex,
    cleanup
  }
}
