<template>
  <div class="connection-panel">
    <div class="panel-title">连接参数</div>

    <el-form label-width="80px" size="small">
      <el-form-item label="通讯方式">
        <el-radio-group v-model="localType" @change="handleTypeChange" :disabled="connectionStatus === 'connected'">
          <el-radio-button value="serial">串口</el-radio-button>
          <el-radio-button value="tcp-client">TCP</el-radio-button>
          <el-radio-button value="tcp-server">TCP服务端</el-radio-button>
          <el-radio-button value="udp">UDP</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <template v-if="localType === 'serial'">
        <el-form-item label="串口号">
          <el-select v-model="localConfig.port" placeholder="选择串口" :disabled="connectionStatus === 'connected'">
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
            <el-option value="mark" label="标记" />
            <el-option value="space" label="空格" />
          </el-select>
        </el-form-item>

        <el-form-item label="停止位">
          <el-select v-model="localConfig.stopBits" :disabled="connectionStatus === 'connected'">
            <el-option :value="1" label="1" />
            <el-option :value="1.5" label="1.5" />
            <el-option :value="2" label="2" />
          </el-select>
        </el-form-item>
      </template>

      <template v-else-if="localType === 'tcp-client'">
        <el-form-item label="服务器">
          <el-input v-model="localConfig.host" placeholder="IP地址" :disabled="connectionStatus === 'connected'" />
        </el-form-item>

        <el-form-item label="端口">
          <el-input-number v-model="localConfig.port" :min="1" :max="65535" :disabled="connectionStatus === 'connected'" />
        </el-form-item>
      </template>

      <template v-else-if="localType === 'tcp-server'">
        <el-form-item label="监听地址">
          <el-input v-model="localConfig.host" placeholder="0.0.0.0" :disabled="connectionStatus === 'connected'" />
        </el-form-item>

        <el-form-item label="监听端口">
          <el-input-number v-model="localConfig.localPort" :min="1" :max="65535" :disabled="connectionStatus === 'connected'" />
        </el-form-item>
      </template>

      <template v-else-if="localType === 'udp'">
        <el-divider>本地设置</el-divider>

        <el-form-item label="监听地址">
          <el-input v-model="localConfig.host" placeholder="0.0.0.0" :disabled="connectionStatus === 'connected'" />
        </el-form-item>

        <el-form-item label="监听端口">
          <el-input-number v-model="localConfig.localPort" :min="1" :max="65535" :disabled="connectionStatus === 'connected'" />
        </el-form-item>

        <el-divider>远程设置</el-divider>

        <el-form-item label="目标地址">
          <el-input v-model="localConfig.remoteAddress" placeholder="IP地址" />
        </el-form-item>

        <el-form-item label="目标端口">
          <el-input-number v-model="localConfig.remotePort" :min="1" :max="65535" />
        </el-form-item>

        <el-form-item label="广播">
          <el-switch v-model="localConfig.broadcast" />
        </el-form-item>
      </template>

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

    <div class="refresh-ports" v-if="localType === 'serial'">
      <el-button size="small" @click="refreshPorts" :loading="isRefreshing">
        <el-icon><Refresh /></el-icon>刷新串口
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import type { Tab, ConnectionType, ConnectionStatus, SerialConfig, TcpConfig, TcpServerConfig, UdpConfig, SerialPortInfo } from '@/types'

const props = defineProps<{
  tab: Tab | null
  connectionStatus: ConnectionStatus
}>()

const emit = defineEmits<{
  (e: 'connect', config: SerialConfig | TcpConfig | TcpServerConfig | UdpConfig): void
  (e: 'disconnect'): void
}>()

const localType = ref<ConnectionType>('serial')
const localConfig = ref<SerialConfig | TcpConfig | TcpServerConfig | UdpConfig>({
  port: '',
  baudRate: 115200,
  dataBits: 8,
  parity: 'none',
  stopBits: 1
} as SerialConfig)
const availablePorts = ref<SerialPortInfo[]>([])
const isRefreshing = ref(false)

const baudRates = [
  110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400,
  56000, 57600, 74880, 76800, 115200, 128000, 153600, 230400,
  256000, 307200, 460800, 614400, 921600, 1382400
]

const canConnect = computed(() => {
  if (localType.value === 'serial') {
    return !!(localConfig.value as SerialConfig).port
  } else if (localType.value === 'tcp-client') {
    return !!(localConfig.value as TcpConfig).host && !!(localConfig.value as TcpConfig).port
  } else if (localType.value === 'tcp-server') {
    return !!(localConfig.value as TcpServerConfig).localPort
  } else if (localType.value === 'udp') {
    return !!(localConfig.value as UdpConfig).localPort
  }
  return false
})

function handleTypeChange(): void {
  const defaults: Record<ConnectionType, SerialConfig | TcpConfig | TcpServerConfig | UdpConfig> = {
    serial: { port: '', baudRate: 115200, dataBits: 8, parity: 'none', stopBits: 1 },
    'tcp-client': { host: '127.0.0.1', port: 8080 },
    'tcp-server': { host: '0.0.0.0', localPort: 8080 },
    udp: { host: '0.0.0.0', localPort: 8080, remoteAddress: '127.0.0.1', remotePort: 8080, broadcast: false }
  }
  localConfig.value = { ...defaults[localType.value] }
}

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

watch(() => props.tab, (newTab) => {
  if (newTab) {
    localType.value = newTab.type || 'serial'
    localConfig.value = { ...newTab.config }
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
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
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
