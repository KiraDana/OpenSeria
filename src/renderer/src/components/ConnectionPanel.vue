<template>
  <div class="connection-panel">
    <div v-if="collapsed" class="panel-collapsed-trigger" @click="collapsed = false" title="展开参数">
      <el-icon><ArrowRight /></el-icon>
    </div>
    <template v-else>
    <div class="panel-title">
      <span>连接参数</span>
      <el-button size="small" text @click="collapsed = true">
        <el-icon><ArrowDown /></el-icon>
      </el-button>
    </div>
    <el-form label-width="80px" size="small">
        <el-form-item label="串口号">
          <el-select v-model="localConfig.port" placeholder="选择串口" :disabled="connectionStatus === 'connected'" popper-class="serial-port-popper">
            <el-option
              v-for="port in availablePorts"
              :key="port.path"
              :label="port.path"
              :value="port.path"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="波特率">
          <el-select v-model="localConfig.baudRate" :disabled="connectionStatus === 'connected'">
            <el-option v-for="rate in baudRates" :key="rate" :label="rate.toString()" :value="rate" />
          </el-select>
        </el-form-item>

        <el-form-item label="数据位">
          <el-select v-model="localConfig.dataBits" :disabled="connectionStatus === 'connected'">
            <el-option :value="5" label="5" />
            <el-option :value="6" label="6" />
            <el-option :value="7" label="7" />
            <el-option :value="8" label="8" />
          </el-select>
        </el-form-item>

        <el-form-item label="校验位">
          <el-select v-model="localConfig.parity" :disabled="connectionStatus === 'connected'">
            <el-option value="none" label="无" />
            <el-option value="odd" label="奇校验" />
            <el-option value="even" label="偶校验" />
          </el-select>
        </el-form-item>

        <el-form-item label="停止位">
          <el-select v-model="localConfig.stopBits" :disabled="connectionStatus === 'connected'">
            <el-option :value="1" label="1" />
            <el-option :value="1.5" label="1.5" />
            <el-option :value="2" label="2" />
          </el-select>
        </el-form-item>

      <el-form-item>
        <el-button
          v-if="connectionStatus !== 'connected'"
          type="primary"
          @click="handleConnect"
          :disabled="!canConnect"
        >
          打开/连接
        </el-button>
        <el-button
          v-else
          type="danger"
          @click="$emit('disconnect')"
        >
          关闭
        </el-button>
      </el-form-item>
    </el-form>

      <div class="refresh-ports">
        <el-button size="small" @click="refreshPorts" :loading="isRefreshing">
          <el-icon><Refresh /></el-icon>刷新串口
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import type { Tab, ConnectionStatus, SerialConfig, SerialPortInfo } from '@/types'

const props = defineProps<{
  tab: Tab | null
  connectionStatus: ConnectionStatus
}>()

const emit = defineEmits<{
  (e: 'connect', config: SerialConfig): void
  (e: 'disconnect'): void
  (e: 'collapse-change', collapsed: boolean): void
}>()

const collapsed = ref(false)
const localConfig = ref<SerialConfig>({
  port: '',
  baudRate: 115200,
  dataBits: 8,
  parity: 'none',
  stopBits: 1
})
const availablePorts = ref<SerialPortInfo[]>([])
const isRefreshing = ref(false)

const baudRates = [
  110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400,
  56000, 57600, 74880, 76800, 115200, 128000, 153600, 230400,
  256000, 307200, 460800, 614400, 921600, 1382400
]

const canConnect = computed(() => {
  return !!(localConfig.value as SerialConfig).port
})

async function refreshPorts(): Promise<void> {
  isRefreshing.value = true
  try {
    const ports = await window.electronAPI.serial.list()
    availablePorts.value = ports || []
  } catch (error) {
    console.error('Failed to list ports:', error)
  } finally {
    isRefreshing.value = false
  }
}

function handleConnect(): void {
  const config = { ...localConfig.value }
  emit('connect', config)
}

watch(collapsed, (val) => {
  emit('collapse-change', val)
})

watch(() => props.tab, (newTab) => {
  if (newTab) {
    localConfig.value = { ...newTab.config } as SerialConfig
  }
}, { immediate: true })

onMounted(async () => {
  await refreshPorts()
})

defineOptions({
  name: 'ConnectionPanel'
})
</script>

<style scoped>
.connection-panel {
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-collapsed-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  border-radius: 4px;
  transition: all 0.2s;
  user-select: none;
  flex: 1;
}

.panel-collapsed-trigger:hover {
  background-color: var(--primary-bg);
  color: var(--primary-accent);
}

.el-form-item {
  margin-bottom: 12px;
}

.el-divider__text {
  color: var(--text-muted);
  font-size: 12px;
}

.refresh-ports {
  margin-top: 16px;
  text-align: center;
}

.el-select,
.el-input {
  width: 100%;
}

.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>

<style>
.serial-port-popper {
  max-height: 240px;
  overflow-y: auto;
}
</style>
