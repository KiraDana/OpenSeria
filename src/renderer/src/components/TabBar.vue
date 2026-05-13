<template>
  <div class="tab-bar">
    <div class="tabs-container">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab-item', { active: tab.id === activeTab }]"
        @click="$emit('tab-change', tab.id)"
      >
        <el-icon v-if="tab.type === 'serial'"><Monitor /></el-icon>
        <el-icon v-else-if="tab.type === 'tcp-client' || tab.type === 'tcp-server'"><Connection /></el-icon>
        <el-icon v-else><Promotion /></el-icon>
        <span class="tab-name">{{ tab.name }}</span>
        <span :class="['status-dot', tab.status]"></span>
        <el-icon class="close-btn" @click.stop="$emit('tab-close', tab.id)"><Close /></el-icon>
      </div>
    </div>
    <div class="add-tab" @click="$emit('add-tab')">
      <el-icon><Plus /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Monitor, Connection, Promotion, Close, Plus } from '@element-plus/icons-vue'
import type { Tab } from '@/types'

defineProps<{
  tabs: Tab[]
  activeTab: string | null
}>()

defineEmits<{
  (e: 'tab-change', tabId: string): void
  (e: 'tab-close', tabId: string): void
  (e: 'add-tab'): void
}>()

defineOptions({
  name: 'TabBar'
})
</script>

<style scoped>
.tab-bar {
  display: flex;
  align-items: center;
  background-color: var(--secondary-bg);
  border-bottom: 1px solid var(--border-color);
}

.tabs-container {
  display: flex;
  flex: 1;
  overflow-x: auto;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  cursor: pointer;
  border-right: 1px solid var(--border-color);
  color: var(--text-muted);
  transition: all 0.2s;
  min-width: 120px;
  max-width: 180px;
}

.tab-item:hover {
  background-color: var(--primary-bg);
  color: var(--text-color);
}

.tab-item.active {
  background-color: var(--primary-bg);
  color: var(--primary-accent);
  border-bottom: 2px solid var(--primary-accent);
}

.tab-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.connected {
  background-color: var(--send-color);
}

.status-dot.disconnected {
  background-color: var(--text-muted);
}

.status-dot.connecting {
  background-color: var(--primary-accent);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.close-btn {
  font-size: 12px;
  padding: 2px;
  border-radius: 2px;
  opacity: 0;
  transition: all 0.2s;
}

.tab-item:hover .close-btn {
  opacity: 1;
}

.close-btn:hover {
  background-color: var(--error-color);
  color: white;
}

.add-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
}

.add-tab:hover {
  color: var(--primary-accent);
  background-color: var(--primary-bg);
}
</style>
