import { createApp } from 'vue'
import App from './App.vue'
import '@/assets/styles/main.css'

import {
  ElButton, ElSelect, ElOption, ElInput, ElInputNumber,
  ElForm, ElFormItem, ElCheckbox, ElTag, ElIcon, ElMessage
} from 'element-plus'

import {
  ArrowDown, ArrowRight, Close, Delete, List, Monitor, Plus, Promotion, Refresh
} from '@element-plus/icons-vue'

const app = createApp(App)

app.component('ArrowDown', ArrowDown)
app.component('ArrowRight', ArrowRight)
app.component('Close', Close)
app.component('Delete', Delete)
app.component('List', List)
app.component('Monitor', Monitor)
app.component('Plus', Plus)
app.component('Promotion', Promotion)
app.component('Refresh', Refresh)

app.use(ElButton)
app.use(ElSelect)
app.use(ElOption)
app.use(ElInput)
app.use(ElInputNumber)
app.use(ElForm)
app.use(ElFormItem)
app.use(ElCheckbox)
app.use(ElTag)
app.use(ElIcon)
app.use(ElMessage)

app.mount('#app')
