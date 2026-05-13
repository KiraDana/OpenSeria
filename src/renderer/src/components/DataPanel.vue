<template>
  <div class="data-panel">
    <div class="main-content">
      <div class="receive-section">
        <div class="section-header">
          <span class="section-title">接收区</span>
          <div class="section-actions">
            <el-select v-model="receiveFormat" size="small" style="width: 100px;">
              <el-option value="ascii" label="ASCII" />
              <el-option value="hex" label="HEX" />
              <el-option value="mixed" label="混合" />
            </el-select>
            <el-button size="small" @click="$emit('clear-receive')">
              <el-icon><Delete /></el-icon>清空
            </el-button>
          </div>
        </div>
        <div class="receive-area" ref="receiveAreaRef">
          <div
            v-for="(item, index) in displayReceiveData"
            :key="index"
            class="data-row"
          >
            <span class="receive-arrow">{{ item.direction === 'send' ? '→' : '←' }}</span>
            <span class="timestamp">{{ formatTime(item.timestamp) }}</span>
            <span :class="['data-content', item.direction === 'send' ? 'send-data' : 'receive-data']">{{ formatData(item.data, receiveFormat) }}</span>
          </div>
          <div v-if="!displayReceiveData.length" class="empty-hint">
            等待接收数据...
          </div>
        </div>
      </div>

      <div class="send-section">
        <div class="section-header">
          <span class="section-title">发送区</span>
          <div class="section-actions">
            <el-select v-model="sendFormat" size="small" style="width: 100px;">
              <el-option value="string" label="字符串" />
              <el-option value="hex" label="HEX" />
            </el-select>
            <el-button size="small" @click="handleSaveData">
              保存数据
            </el-button>
            <el-checkbox v-model="showTimestamp" size="small">时间戳</el-checkbox>
            <el-button size="small" @click="$emit('clear-send')">
              <el-icon><Delete /></el-icon>清空
            </el-button>
          </div>
        </div>

        <div class="crc-section">
          <el-checkbox v-model="enableCrc" size="small">追加CRC</el-checkbox>
          <el-select v-if="enableCrc" v-model="crcType" size="small" style="width: 80px;">
            <el-option value="crc8" label="CRC8" />
            <el-option value="crc16" label="CRC16" />
            <el-option value="xor" label="XOR" />
            <el-option value="lrc" label="LRC" />
          </el-select>
          <el-select v-if="enableCrc && crcType === 'crc16'" v-model="crcByteOrder" size="small" style="width: 100px;">
            <el-option value="high-first" label="高字节先" />
            <el-option value="low-first" label="低字节先" />
          </el-select>
        </div>

        <div class="send-input-area">
          <el-input
            v-model="sendData"
            type="textarea"
            :rows="4"
            :placeholder="sendFormat === 'hex' ? 'AA BB CC DD' : '输入发送数据...'"
            @keydown.ctrl.enter="handleSend"
          />
          <el-button type="success" @click="handleSend">
            <el-icon><Promotion /></el-icon>发送
          </el-button>
        </div>
      </div>
    </div>

    <div
      class="resize-handle-v"
      style="height: 100%;"
      @mousedown.stop="startResize"
    ></div>

    <div
      v-if="isResizingLocal"
      class="resize-overlay"
      :style="{ width: tempWidth + 'px' }"
    ></div>

    <div class="preset-section" :style="{ width: presetWidth + 'px' }">
      <div class="preset-header">
        <div class="header-title">
          <span class="header-main">预设数据</span>
          <el-button
            :type="isCyclicSending ? 'danger' : 'primary'"
            size="small"
            @click="toggleCyclicSend"
            :disabled="!hasSelectedPresets"
          >
            {{ isCyclicSending ? '停止发送' : '循环发送' }}
          </el-button>
        </div>
        <el-button size="small" text @click="clearAllPresets">
          <el-icon><Delete /></el-icon>清空
        </el-button>
      </div>
      <div class="preset-table">
        <div class="preset-table-header">
          <span class="col-checkbox"></span>
          <span class="col-format">格式</span>
          <span class="col-data">预设数据</span>
          <span class="col-delay">延迟(ms)</span>
          <span class="col-btn">点击发送</span>
        </div>
        <div class="preset-table-body">
          <div v-for="i in 99" :key="i" class="preset-row">
            <el-checkbox v-model="presetSelected[i - 1]" size="small" />
            <el-select v-model="presetFormats[i - 1]" size="small" class="col-format-select">
              <el-option value="hex" label="HEX" />
              <el-option value="string" label="字符串" />
            </el-select>
            <el-input
              v-model="presets[i - 1]"
              size="small"
              :placeholder="presetFormats[i - 1] === 'hex' ? 'AA BB CC DD' : '输入字符串...'"
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
import { Delete, Promotion } from '@element-plus/icons-vue'
import type { Tab, DataFormat, DataItem } from '@/types'

const props = defineProps<{
  tab: Tab | null
}>()

const emit = defineEmits<{
  (e: 'send', data: string, fromTabId?: string): void
  (e: 'clear-receive'): void
  (e: 'clear-send'): void
  (e: 'update-format', payload: { type: 'receive' | 'send'; format: DataFormat }): void
  (e: 'show-error', message: string): void
}>()

const receiveFormat = computed(() => props.tab?.receiveFormat || 'hex')
const sendFormat = ref<DataFormat>('hex')
const showTimestamp = ref(true)
const sendData = ref('')
const enableCrc = ref(false)
const crcType = ref('crc16')
const crcByteOrder = ref('low-first')
const receiveAreaRef = ref<HTMLElement | null>(null)
const presets = ref<string[]>(Array(99).fill(''))
const presetSelected = ref<boolean[]>(Array(99).fill(false))
const presetFormats = ref<DataFormat[]>(Array(99).fill('hex'))
const presetDelays = ref<number[]>(Array(99).fill(0))
const presetWidth = ref(280)
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
  if (!props.tab?.receiveData) return []
  return props.tab.receiveData.slice(-500)
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

async function loadPresets(): Promise<void> {
  if (!window.electronAPI?.config) return
  try {
    const savedPresets = await window.electronAPI.config.get('presets')
    if (savedPresets && savedPresets.length === 99) {
      presets.value = savedPresets
    }
    const savedFormats = await window.electronAPI.config.get('presetFormats')
    if (savedFormats && savedFormats.length === 99) {
      presetFormats.value = savedFormats
    }
    const savedDelays = await window.electronAPI.config.get('presetDelays')
    if (savedDelays && savedDelays.length === 99) {
      presetDelays.value = savedDelays
    }
    const savedSelected = await window.electronAPI.config.get('presetSelected')
    if (savedSelected && savedSelected.length === 99) {
      presetSelected.value = savedSelected
    }
  } catch (e) {
    console.error('Failed to load presets:', e)
  }
}

async function savePresets(): Promise<void> {
  if (!window.electronAPI?.config) return
  try {
    await window.electronAPI.config.set('presets', JSON.parse(JSON.stringify(presets.value)))
    await window.electronAPI.config.set('presetFormats', JSON.parse(JSON.stringify(presetFormats.value)))
    await window.electronAPI.config.set('presetDelays', JSON.parse(JSON.stringify(presetDelays.value)))
    await window.electronAPI.config.set('presetSelected', JSON.parse(JSON.stringify(presetSelected.value)))
  } catch (e) {
    console.error('Failed to save presets:', e)
  }
}

function clearAllPresets(): void {
  presets.value = Array(99).fill('')
  presetFormats.value = Array(99).fill('hex')
  presetDelays.value = Array(99).fill(0)
  presetSelected.value = Array(99).fill(false)
  savePresets()
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

  const tab = props.tab
  if (!tab || tab.status !== 'connected' || !tab.connectionId) {
    stopCyclicSend(tabId)
    emit('show-error', '连接已断开，循环发送已停止')
    return
  }

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

  if (format === 'ascii') {
    try {
      const hex = data.replace(/\s/g, '')
      const str: string[] = []
      for (let i = 0; i < hex.length; i += 2) {
        str.push(String.fromCharCode(parseInt(hex.substring(i, i + 2), 16)))
      }
      return str.join('')
    } catch {
      return data
    }
  } else if (format === 'hex') {
    return data.replace(/\s/g, '').match(/.{1,2}/g)?.join(' ') || data
  } else if (format === 'mixed') {
    try {
      const hex = data.replace(/\s/g, '')
      const ascii: string[] = []
      const hexStr: string[] = []
      for (let i = 0; i < hex.length; i += 2) {
        const byte = parseInt(hex.substring(i, i + 2), 16)
        hexStr.push(byte.toString(16).toUpperCase().padStart(2, '0'))
        ascii.push(byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.')
      }
      return `${hexStr.join(' ')}  ${ascii.join('')}`
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
  }

  if (enableCrc.value && sendFormat.value === 'hex') {
    try {
      const crc = await window.electronAPI.crc.calculate(dataToSend, crcType.value, crcByteOrder.value)
      dataToSend = dataToSend + crc
    } catch (error) {
      console.error('CRC calculation failed:', error)
    }
  }

  emit('send', dataToSend)
}

async function handleSaveData(): Promise<void> {
  if (!props.tab?.receiveData || props.tab.receiveData.length === 0) {
    ElMessage.warning('没有数据可保存')
    return
  }

  const content = props.tab.receiveData.map((item: DataItem) => {
    const time = formatTime(item.timestamp)
    const data = formatData(item.data, 'hex')
    return `${time}  ${data}`
  }).join('\n')

  const result = await window.electronAPI.data.save(content, `receive_data_${Date.now()}.txt`)

  if (result.success) {
    ElMessage.success('数据已保存到: ' + result.filePath)
  } else if (!result.canceled) {
    ElMessage.error('保存失败: ' + result.error)
  }
}

watch(() => props.tab?.receiveData, async () => {
  await nextTick()
  requestAnimationFrame(() => {
    if (receiveAreaRef.value) {
      const area = receiveAreaRef.value
      area.scrollTop = area.scrollHeight
    }
  })
}, { deep: true })

watch(receiveFormat, (newVal) => {
  emit('update-format', { type: 'receive', format: newVal as DataFormat })
})

watch(sendFormat, (newVal) => {
  emit('update-format', { type: 'send', format: newVal as DataFormat })
})

watch([presets, presetFormats, presetDelays, presetSelected], () => {
  savePresets()
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
  loadPresets()
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
</style>
