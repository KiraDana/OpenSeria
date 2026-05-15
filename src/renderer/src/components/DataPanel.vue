<template>
  <div class="data-panel">
    <div class="main-content">
      <div class="receive-section">
        <div class="section-header">
          <span class="section-title">{{ i18n.t('receiveArea') }}</span>
          <div class="section-actions">
            <el-input
              v-model="searchQuery"
              :placeholder="i18n.t('search')"
              size="small"
              clearable
              style="width: 130px;"
              @input="onSearchInput"
            />
            <el-button size="small" :disabled="matchIndices.length === 0" @click="goToPrevMatch" :title="i18n.t('search')">
              <el-icon><ArrowUp /></el-icon>
            </el-button>
            <span v-if="matchIndices.length > 0" class="match-counter">{{ currentMatchIndex + 1 }}/{{ matchIndices.length }}</span>
            <el-button size="small" :disabled="matchIndices.length === 0" @click="goToNextMatch" :title="i18n.t('search')">
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <el-select v-model="filterDirection" size="small" style="width: 90px;">
              <el-option value="all" :label="i18n.t('filterAll')" />
              <el-option value="receive" :label="i18n.t('filterReceive')" />
              <el-option value="send" :label="i18n.t('filterSend')" />
            </el-select>
            <el-button size="small" :type="receivingPaused ? 'warning' : ''" @click="toggleReceiving">
              {{ receivingPaused ? i18n.t('resumeReceiving') : i18n.t('stopReceiving') }}
            </el-button>
            <el-button size="small" @click="$emit('clear-receive')">
              <el-icon><Delete /></el-icon>{{ i18n.t('clear') }}
            </el-button>
          </div>
        </div>
        <div class="receive-area" ref="receiveAreaRef">
          <div
            v-for="(item, index) in filteredByDirection"
            :key="index"
            :data-row-index="index"
            :class="['data-row', { 'row-match': isMatch(index) }]"
          >
            <span class="receive-arrow">{{ item.direction === 'send' ? '→' : '←' }}</span>
            <span class="timestamp">{{ formatTime(item.timestamp) }}</span>
            <span :class="['data-content', item.direction === 'send' ? 'send-data' : 'receive-data']">
              <template v-for="(part, pi) in highlightText(formatData(item.data, sendFormat))" :key="pi">
                <mark v-if="part.highlight">{{ part.text }}</mark>
                <span v-else>{{ part.text }}</span>
              </template>
            </span>
          </div>
          <div v-if="!filteredByDirection.length" class="empty-hint">
            {{ i18n.t('waitingData') }}
          </div>
        </div>
      </div>

      <div class="send-section">
        <div class="section-header">
          <span class="section-title">{{ i18n.t('sendArea') }}</span>
          <div class="section-actions">
            <el-select v-model="sendFormat" size="small" style="width: 100px;">
              <el-option value="hex" :label="i18n.t('hex')" />
              <el-option value="ascii" :label="i18n.t('ascii')" />
            </el-select>
            <el-button size="small" @click="handleSaveData">
              {{ i18n.t('saveData') }}
            </el-button>
            <el-checkbox v-model="showTimestamp" size="small">{{ i18n.t('timestamp') }}</el-checkbox>
            <el-button size="small" :type="!presetCollapsed ? 'primary' : ''" @click="presetCollapsed = !presetCollapsed">
              <el-icon><List /></el-icon>{{ i18n.t('preset') }}
            </el-button>
          </div>
        </div>

        <div class="crc-section">
          <el-checkbox v-model="enableCrc" size="small" v-if="sendFormat === 'hex'">{{ i18n.t('appendCrc') }}</el-checkbox>
          <el-select v-if="enableCrc && sendFormat === 'hex'" v-model="crcType" size="small" style="width: 80px;">
            <el-option value="crc8" :label="i18n.t('crc8')" />
            <el-option value="crc16" :label="i18n.t('crc16')" />
            <el-option value="xor" :label="i18n.t('xor')" />
            <el-option value="lrc" :label="i18n.t('lrc')" />
          </el-select>
          <el-select v-if="enableCrc && crcType === 'crc16' && sendFormat === 'hex'" v-model="crcByteOrder" size="small" style="width: 100px;">
            <el-option value="high-first" :label="i18n.t('highFirst')" />
            <el-option value="low-first" :label="i18n.t('lowFirst')" />
          </el-select>
          <el-divider direction="vertical" />
          <el-checkbox v-model="autoNewlineEnabled" size="small">{{ i18n.t('autoNewline') }}</el-checkbox>
          <el-select v-if="autoNewlineEnabled" v-model="autoNewlineType" size="small" style="width: 90px;">
            <el-option value="crlf" :label="i18n.t('newlineCrlf')" />
            <el-option value="lf" :label="i18n.t('newlineLf')" />
          </el-select>
        </div>

        <div class="send-input-area">
          <el-input
            v-model="sendData"
            type="textarea"
            :rows="4"
            :placeholder="sendFormat === 'hex' ? i18n.t('placeholderHex') : i18n.t('placeholderAscii')"
            @keydown.ctrl.enter="handleSend"
          />
          <el-button type="success" @click="handleSend">
            <el-icon><Promotion /></el-icon>{{ i18n.t('send') }}
          </el-button>
        </div>
      </div>
    </div>

    <div
      v-show="!presetCollapsed"
      class="resize-handle-v"
      @mousedown.stop="startResize"
    ></div>

    <div
      v-if="isResizingLocal"
      class="resize-overlay"
      :style="{ width: tempWidth + 'px' }"
    ></div>

    <div v-show="!presetCollapsed" class="preset-section" :style="{ width: presetWidth + 'px' }">
      <div class="preset-header">
        <div class="header-title">
          <div class="header-title-row">
            <span class="header-main">{{ i18n.t('presetData') }}</span>
            <el-button size="small" text @click="presetCollapsed = true" :title="i18n.t('collapse')">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <div class="header-actions">
            <el-button
              :type="isCyclicSending ? 'danger' : 'primary'"
              size="small"
              @click="toggleCyclicSend"
              :disabled="!hasSelectedPresets"
            >
              {{ isCyclicSending ? i18n.t('stopSend') : i18n.t('cyclicSend') }}
            </el-button>
            <el-button size="small" text @click="exportPresets" :title="i18n.t('exportPreset')">
              <el-icon><Upload /></el-icon>
            </el-button>
            <el-button size="small" text @click="importPresets" :title="i18n.t('importPreset')">
              <el-icon><Download /></el-icon>
            </el-button>
            <el-button size="small" text @click="clearAllPresets">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
      <div class="preset-table">
        <div class="preset-table-header">
          <span class="col-checkbox"></span>
          <span class="col-format">{{ i18n.t('format') }}</span>
          <span class="col-data">{{ i18n.t('data') }}</span>
          <span class="col-delay">{{ i18n.t('delay') }}</span>
          <span class="col-btn">{{ i18n.t('clickToSend') }}</span>
        </div>
        <div class="preset-table-body">
          <div v-for="i in 99" :key="i" class="preset-row">
            <el-checkbox v-model="presetSelected[i - 1]" size="small" />
            <el-select v-model="presetFormats[i - 1]" size="small" class="col-format-select">
              <el-option value="hex" :label="i18n.t('hex')" />
              <el-option value="ascii" :label="i18n.t('ascii')" />
            </el-select>
            <el-input
              v-model="presets[i - 1]"
              size="small"
              :placeholder="presetFormats[i - 1] === 'hex' ? i18n.t('placeholderHex') : i18n.t('placeholderAscii')"
            />
            <el-input-number v-model="presetDelays[i - 1]" :min="0" :max="10000" size="small" class="col-delay-input" />
            <el-button size="small" class="row-btn" @click="sendPresetByIndex(i - 1)">{{ i }}</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { i18n } from '@/composables/useI18n'
import type { Tab, DataFormat, DataItem } from '@/types'

const props = defineProps<{
  tab: Tab | null
}>()

const emit = defineEmits<{
  (e: 'send', data: string, fromTabId?: string): void
  (e: 'clear-receive'): void
  (e: 'clear-send'): void
  (e: 'update-format', payload: { type: 'send'; format: DataFormat }): void
  (e: 'show-error', message: string): void
}>()

const sendFormat = ref<DataFormat>('hex')
watch(() => props.tab?.sendFormat, (val) => {
  if (val) sendFormat.value = val as DataFormat
}, { immediate: true })

function syncFromTab(): void {
  if (!props.tab) return
  showTimestamp.value = props.tab.showTimestamp
  presetCollapsed.value = props.tab.presetCollapsed
  presets.value = [...props.tab.presets]
  presetSelected.value = [...props.tab.presetSelected]
  presetFormats.value = [...props.tab.presetFormats] as DataFormat[]
  presetDelays.value = [...props.tab.presetDelays]
}

function syncToTab(): void {
  if (!props.tab) return
  props.tab.showTimestamp = showTimestamp.value
  props.tab.presetCollapsed = presetCollapsed.value
  props.tab.presets = [...presets.value]
  props.tab.presetSelected = [...presetSelected.value]
  props.tab.presetFormats = [...presetFormats.value]
  props.tab.presetDelays = [...presetDelays.value]
}

const showTimestamp = ref(true)
const sendData = ref('')
const enableCrc = ref(false)
const crcType = ref('crc16')
const crcByteOrder = ref('low-first')
const receiveAreaRef = ref<HTMLElement | null>(null)

const receivingPaused = computed({
  get: () => props.tab?.receivingPaused ?? false,
  set: (val) => { if (props.tab) props.tab.receivingPaused = val }
})

const searchQuery = computed({
  get: () => props.tab?.searchQuery ?? '',
  set: (val) => { if (props.tab) props.tab.searchQuery = val }
})

const filterDirection = computed({
  get: () => (props.tab?.filterDirection ?? 'all') as 'all' | 'receive' | 'send',
  set: (val) => { if (props.tab) props.tab.filterDirection = val }
})

const currentMatchIndex = computed({
  get: () => props.tab?.currentMatchIndex ?? 0,
  set: (val) => { if (props.tab) props.tab.currentMatchIndex = val }
})

const autoNewlineEnabled = ref(false)
const autoNewlineType = ref<'crlf' | 'lf'>('crlf')
const presets = ref<string[]>(Array(99).fill(''))
const presetSelected = ref<boolean[]>(Array(99).fill(false))
const presetFormats = ref<DataFormat[]>(Array(99).fill('ascii'))
const presetDelays = ref<number[]>(Array(99).fill(0))
const presetCollapsed = ref(true)
const presetWidth = ref(400)
const tempWidth = ref(280)
const isResizingLocal = ref(false)

const cyclicUpdateTrigger = ref(0)
let cyclicWorker: Worker | null = null

const isCyclicSending = computed(() => {
  cyclicUpdateTrigger.value
  return props.tab?.isCyclicSending || false
})

const hasSelectedPresets = computed(() => {
  return presetSelected.value.some(selected => selected)
})

const displayReceiveData = computed(() => {
  const tab = props.tab
  if (!tab?.receiveData) return []
  if (receivingPaused.value) return tab.frozenReceiveData
  return tab.receiveData.slice(-500)
})

const filteredByDirection = computed(() => {
  const data = displayReceiveData.value
  if (filterDirection.value === 'all') return data
  return data.filter(item => {
    const dir = item.direction || 'receive'
    return dir === filterDirection.value
  })
})

const matchIndices = computed(() => {
  if (!searchQuery.value) return []
  const query = searchQuery.value.toLowerCase()
  return filteredByDirection.value.reduce((indices, item, idx) => {
    const text = formatData(item.data, sendFormat.value).toLowerCase()
    if (text.includes(query)) indices.push(idx)
    return indices
  }, [] as number[])
})

function toggleReceiving(): void {
  if (receivingPaused.value) {
    receivingPaused.value = false
  } else {
    receivingPaused.value = true
    if (props.tab?.receiveData) {
      props.tab.frozenReceiveData = props.tab.receiveData.slice(-500)
    }
  }
}

function onSearchInput(): void {
  currentMatchIndex.value = 0
}

function isMatch(index: number): boolean {
  return matchIndices.value.includes(index)
}

function goToPrevMatch(): void {
  if (matchIndices.value.length === 0) return
  currentMatchIndex.value = (currentMatchIndex.value - 1 + matchIndices.value.length) % matchIndices.value.length
  scrollToMatch(matchIndices.value[currentMatchIndex.value])
}

function goToNextMatch(): void {
  if (matchIndices.value.length === 0) return
  currentMatchIndex.value = (currentMatchIndex.value + 1) % matchIndices.value.length
  scrollToMatch(matchIndices.value[currentMatchIndex.value])
}

function scrollToMatch(index: number): void {
  const area = receiveAreaRef.value
  if (!area) return
  const row = area.querySelector(`[data-row-index="${index}"]`) as HTMLElement
  if (row) {
    row.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function highlightText(text: string): { text: string; highlight: boolean }[] {
  const query = searchQuery.value
  if (!query) return [{ text, highlight: false }]
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const parts: { text: string; highlight: boolean }[] = []
  let start = 0
  let index = lowerText.indexOf(lowerQuery, start)
  while (index !== -1) {
    if (index > start) {
      parts.push({ text: text.slice(start, index), highlight: false })
    }
    parts.push({ text: text.slice(index, index + query.length), highlight: true })
    start = index + query.length
    index = lowerText.indexOf(lowerQuery, start)
  }
  if (start < text.length) {
    parts.push({ text: text.slice(start), highlight: false })
  }
  return parts
}

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
      sendPresetByIndexAndContinue(index, tabId)
      const worker = getWorker()
      if (worker) {
        worker.postMessage({ type: 'continue', tabId })
      }
    }
  }
}

function startResize(e: MouseEvent): void {
  const startX = e.clientX
  const startWidth = presetWidth.value
  let isResizing = true

  isResizingLocal.value = true
  tempWidth.value = startWidth

  const doResize = (ev: MouseEvent) => {
    if (!isResizing) return
    const delta = ev.clientX - startX
    const newWidth = Math.max(200, Math.min(500, startWidth - delta))
    tempWidth.value = newWidth
  }

  const stopResize = () => {
    isResizing = false
    isResizingLocal.value = false
    presetWidth.value = tempWidth.value
  }

  document.addEventListener('mousemove', doResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.body.classList.add('resizing')

  setTimeout(() => {
    document.removeEventListener('mousemove', doResize)
    document.removeEventListener('mouseup', stopResize)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    document.body.classList.remove('resizing')
  }, 5000)
}

async function exportPresets(): Promise<void> {
  const data = JSON.stringify({
    presets: presets.value,
    presetFormats: presetFormats.value,
    presetDelays: presetDelays.value,
    presetSelected: presetSelected.value
  }, null, 2)
  const result = await window.electronAPI.util.savePreset(data)
  if (result.success) {
    ElMessage.success(i18n.t('exportSuccess') + result.filePath)
  } else if (!result.canceled) {
    ElMessage.error(i18n.t('exportFailed') + result.error)
  }
}

async function importPresets(): Promise<void> {
  const result = await window.electronAPI.util.loadPreset()
  if (!result.success || !result.data) {
    if (!result.canceled) ElMessage.error(i18n.t('importFailed') + result.error)
    return
  }
  try {
    const data = JSON.parse(result.data)
    if (data.presets?.length === 99) presets.value = data.presets
    if (data.presetFormats?.length === 99) presetFormats.value = data.presetFormats
    if (data.presetDelays?.length === 99) presetDelays.value = data.presetDelays
    if (data.presetSelected?.length === 99) presetSelected.value = data.presetSelected
    syncToTab()
    ElMessage.success(i18n.t('importSuccess'))
  } catch {
    ElMessage.error(i18n.t('importFormatError'))
  }
}

function clearAllPresets(): void {
  presets.value = Array(99).fill('')
  presetFormats.value = Array(99).fill('hex')
  presetDelays.value = Array(99).fill(0)
  presetSelected.value = Array(99).fill(false)
  syncToTab()
}

function toggleCyclicSend(): void {
  const tabId = props.tab?.id
  if (!tabId) return

  const manager = window.cycleSendManager || {}
  const currentData = manager[tabId]
  const currentTabCyclic = currentData?.isCyclicSending || props.tab?.isCyclicSending || false

  if (currentTabCyclic) {
    stopCyclicSend(tabId)
  } else {
    if (props.tab?.status !== 'connected' || !props.tab?.connectionId) {
      ElMessage.error(i18n.t('connectSerial'))
      return
    }
    startCyclicSend()
  }
}

function startCyclicSend(): void {
  const selectedIndices = presetSelected.value
    .map((selected, idx) => selected ? idx : -1)
    .filter(idx => idx !== -1)

  if (selectedIndices.length === 0) return

  const tabId = props.tab?.id
  if (!tabId) return

  window.cycleSendManager = window.cycleSendManager || {}
  window.cycleSendManager[tabId] = {
    isCyclicSending: true,
    selectedIndices,
    delays: selectedIndices.map(idx => presetDelays.value[idx] || 0),
    presets: [...presets.value],
    formats: [...presetFormats.value],
    tabId
  }

  if (props.tab) {
    props.tab.isCyclicSending = true
  }
  cyclicUpdateTrigger.value++
  sendNextPreset(-1, tabId)
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

  if (props.tab) {
    props.tab.isCyclicSending = false
  }

  cyclicUpdateTrigger.value++
}

async function sendPresetByIndex(index: number): Promise<void> {
  await sendPresetByIndexAndContinue(index, props.tab?.id || '')
}

async function sendPresetByIndexAndContinue(index: number, tabId: string): Promise<void> {
  const manager = window.cycleSendManager || {}
  const data = manager[tabId]

  const presetsData = data?.presets || presets.value
  const formatsData = data?.formats || presetFormats.value

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
    emit('send', dataToSend, tabId)
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
        sendPresetByIndexAndContinue(nextIndex, tabId)
        sendNextPreset(nextIndex, tabId)
      }
    }, delay)
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  const s = date.getSeconds().toString().padStart(2, '0')
  const ms = date.getMilliseconds().toString().padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

function formatData(data: string, format: DataFormat): string {
  if (!data) return ''

  if (format === 'hex') {
    return data.replace(/\s/g, '').match(/.{1,2}/g)?.join(' ') || data
  }

  if (format === 'ascii') {
    try {
      const hex = data.replace(/\s/g, '')
      const str: string[] = []
      for (let i = 0; i < hex.length; i += 2) {
        const code = parseInt(hex.substring(i, i + 2), 16)
        str.push(code >= 32 && code <= 126 ? String.fromCharCode(code) : '.')
      }
      return str.join('')
    } catch {
      return data
    }
  }

  return data
}

async function handleSend(): Promise<void> {
  if (!sendData.value) return

  let dataToSend = sendData.value

  if (sendFormat.value === 'hex') {
    dataToSend = dataToSend.replace(/\s/g, '')
  } else {
    const arr: string[] = []
    for (let i = 0; i < dataToSend.length; i++) {
      arr.push(dataToSend.charCodeAt(i).toString(16).padStart(2, '0'))
    }
    dataToSend = arr.join('')
  }

  if (enableCrc.value) {
    try {
      const crc = await window.electronAPI.crc.calculate(dataToSend, crcType.value, crcByteOrder.value)
      dataToSend = dataToSend + crc
    } catch (error) {
      console.error('CRC calculation failed:', error)
    }
  }

  if (autoNewlineEnabled.value) {
    if (autoNewlineType.value === 'crlf') {
      dataToSend += '0D0A'
    } else {
      dataToSend += '0A'
    }
  }

  emit('send', dataToSend)
}

async function handleSaveData(): Promise<void> {
  if (!props.tab?.receiveData || props.tab.receiveData.length === 0) {
    ElMessage.warning(i18n.t('noDataToSave'))
    return
  }

  const content = props.tab.receiveData.map((item: DataItem) => {
    const dir = item.direction === 'send' ? '→' : '←'
    const time = formatTime(item.timestamp)
    const data = formatData(item.data, 'hex')
    return `${dir} ${time}  ${data}`
  }).join('\n')

  const result = await window.electronAPI.data.save(content, `receive_data_${Date.now()}.txt`)

  if (result.success) {
    ElMessage.success(i18n.t('dataSaved') + result.filePath)
  } else if (!result.canceled) {
    ElMessage.error(i18n.t('saveFailed') + result.error)
  }
}

watch(() => props.tab?.receiveData, async () => {
  if (receivingPaused.value) return
  await nextTick()
  requestAnimationFrame(() => {
    if (receiveAreaRef.value) {
      const area = receiveAreaRef.value
      area.scrollTop = area.scrollHeight
    }
  })
}, { deep: true })

watch(sendFormat, (newVal) => {
  emit('update-format', { type: 'send', format: newVal as DataFormat })
})

watch(() => props.tab, () => {
  syncFromTab()
}, { deep: false })

watch([presets, presetFormats, presetDelays, presetSelected], () => {
  syncToTab()
}, { deep: true })

watch(() => props.tab?.isCyclicSending, (newVal, oldVal) => {
  if (oldVal === true && newVal === false) {
    const tabId = props.tab?.id
    if (tabId) {
      const worker = getWorker()
      if (worker) {
        worker.postMessage({ type: 'stop', tabId })
      }
    }
    cyclicUpdateTrigger.value++
  }
})

onMounted(() => {
  syncFromTab()
})

defineOptions({
  name: 'DataPanel'
})
</script>

<style scoped>
.data-panel {
  display: flex;
  flex-direction: row;
  height: 100%;
  padding: 8px;
  gap: 8px;
}

.main-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 12px;
}

.receive-section,
.send-section {
  display: flex;
  flex-direction: column;
  background-color: var(--secondary-bg);
  border-radius: 4px;
  overflow: hidden;
}

.receive-section {
  flex: 1;
  min-height: 150px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background-color: var(--primary-bg);
  border-bottom: 1px solid var(--border-color);
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color);
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.receive-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px 6px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.empty-hint {
  color: var(--text-muted);
  text-align: center;
  padding: 20px;
  font-size: 12px;
}

.send-section {
  min-height: 200px;
}

.crc-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
}

.send-input-area {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
}

.send-input-area .el-textarea {
  flex: 1;
}

.preset-section {
  display: flex;
  flex-direction: column;
  background-color: var(--secondary-bg);
  border-radius: 4px;
  padding: 8px;
  width: 280px;
  flex-shrink: 0;
  min-width: 200px;
  max-width: 500px;
}

.resize-overlay {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  background-color: var(--secondary-bg);
  border-radius: 4px;
  pointer-events: none;
  z-index: 100;
}

.resize-handle-v {
  width: 8px;
  background-color: var(--border-color);
  cursor: col-resize;
  flex-shrink: 0;
  transition: background-color 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resize-handle-v::before {
  content: '';
  width: 2px;
  height: 30px;
  background-color: var(--text-muted);
  border-radius: 1px;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.resize-handle-v:hover::before,
.resize-handle-v:active::before {
  opacity: 1;
  background-color: var(--el-color-primary);
}

.resize-handle-v:hover {
  background-color: rgba(64, 158, 255, 0.1);
}

.resize-handle-v:active {
  background-color: rgba(64, 158, 255, 0.2);
}

.preset-collapsed-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  flex-shrink: 0;
  border-radius: 4px;
  transition: all 0.2s;
  user-select: none;
  padding: 0 4px;
}

.preset-collapsed-trigger:hover {
  background-color: var(--primary-bg);
  color: var(--primary-accent);
}

.preset-collapsed-trigger .el-icon {
  font-size: 14px;
}

.preset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.preset-table {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.preset-table-header {
  display: flex;
  align-items: center;
  padding: 4px 4px;
  background-color: var(--primary-bg);
  border-radius: 2px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
}

.col-checkbox {
  width: 18px;
  flex-shrink: 0;
}

.col-format {
  width: 70px;
  flex-shrink: 0;
  text-align: center;
}

.col-data {
  flex: 1;
}

.col-btn {
  width: 40px;
  text-align: center;
  flex-shrink: 0;
}

.col-format-select {
  width: 70px;
}

.col-delay {
  width: 90px;
  text-align: center;
  flex-shrink: 0;
}

.col-delay-input {
  width: 90px;
}

.preset-table-body {
  flex: 1;
  overflow-y: auto;
  margin-top: 4px;
}

.preset-row {
  display: flex;
  align-items: center;
  padding: 2px 4px;
  gap: 4px;
}

.preset-row:hover {
  background-color: var(--primary-bg);
}

.row-btn {
  width: 40px;
  height: 24px;
  padding: 0 4px;
  font-size: 11px;
  font-weight: 600;
}

.preset-row .el-input {
  flex: 1;
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-main {
  font-weight: 600;
  font-size: 12px;
}

:global(body.resizing) {
  cursor: col-resize !important;
}

:global(body.resizing *) {
  cursor: col-resize !important;
  user-select: none !important;
}

.data-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 2px 0;
}

.receive-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
}

.timestamp {
  color: var(--text-muted);
  flex-shrink: 0;
  font-size: 11px;
}

.data-content {
  word-break: break-all;
}

.send-data {
  color: var(--send-color);
}

.receive-data {
  color: var(--receive-color);
}

.row-match {
  background-color: rgba(255, 255, 0, 0.15);
  border-radius: 2px;
}

.match-counter {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
}

mark {
  background-color: #ffdd57;
  color: #333;
  padding: 0 1px;
  border-radius: 1px;
}
</style>
