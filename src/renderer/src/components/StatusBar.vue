<template>
  <div class="status-bar">
    <div class="status-left">
      <span :class="['connection-status', connectionStatus]">
        <span class="status-dot"></span>
        {{ statusText }}
      </span>
    </div>

    <div class="status-center">
      <span class="status-item" v-if="tab && connectionStatus === 'connected'">
        {{ connectionInfo }}
      </span>
      <span class="status-item" v-if="connectionStatus === 'disconnected' && errorMessage">
        <span class="error-message">{{ errorMessage }}</span>
      </span>
    </div>

    <div class="status-right">
      <span class="status-item">
        <span class="receive-label">{{ i18n.t('receive') }}:</span>
        <span class="receive-count">{{ formatCount(tab?.receiveCount || 0) }}</span>
      </span>
      <span class="status-item">
        <span class="send-label">{{ i18n.t('send') }}:</span>
        <span class="send-count">{{ formatCount(tab?.sendCount || 0) }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { i18n } from '@/composables/useI18n'
import type { Tab, ConnectionStatus } from '@/types'

const props = defineProps<{
  tab: Tab | null
  connectionStatus: ConnectionStatus
  errorMessage: string
}>()

const statusText = computed(() => {
  switch (props.connectionStatus) {
    case 'connected':
      return i18n.t('statusConnected')
    case 'connecting':
      return i18n.t('statusConnecting')
    default:
      return i18n.t('statusDisconnected')
  }
})

const connectionInfo = computed(() => {
  if (!props.tab?.config) return '-'
  const config = props.tab.config as any
  return config.port || config.host || '-'
})

function formatCount(count: number): string {
  if (count < 1024) return count.toString()
  if (count < 1024 * 1024) return (count / 1024).toFixed(1) + ' KB'
  return (count / 1024 / 1024).toFixed(1) + ' MB'
}

defineOptions({
  name: 'StatusBar'
})
</script>

<style scoped>
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 16px;
  background-color: var(--secondary-bg);
  border-top: 1px solid var(--border-color);
  font-size: 12px;
}

.status-left,
.status-center,
.status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.connection-status.connected .status-dot {
  background-color: var(--send-color);
}

.connection-status.disconnected .status-dot {
  background-color: var(--text-muted);
}

.connection-status.connecting .status-dot {
  background-color: var(--primary-accent);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-item {
  color: var(--text-muted);
}

.receive-label,
.send-label {
  color: var(--text-muted);
}

.receive-count {
  color: var(--receive-color);
}

.send-count {
  color: var(--send-color);
}

.error-message {
  color: #f56c6c;
  font-weight: 500;
}
</style>
