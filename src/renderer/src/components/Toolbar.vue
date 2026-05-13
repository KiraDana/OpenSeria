<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <div class="app-brand">
        <svg class="app-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="app-title">OpenSerial</span>
      </div>
    </div>
    <div class="toolbar-right">
      <el-tag size="small" type="info">v1.0.0</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'Toolbar'
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-icon {
  width: 28px;
  height: 28px;
  color: var(--primary-accent);
}

.app-title {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(90deg, var(--primary-accent), var(--secondary-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.5px;
}
</style>
