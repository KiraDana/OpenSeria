import { ref, computed, reactive } from 'vue'

export type Language = 'zh' | 'en'

const currentLanguage = ref<Language>('zh')

export const i18n = reactive({
  language: currentLanguage,
  t: (key: keyof typeof messages.zh): string => {
    return messages[currentLanguage.value][key] || key
  },
  setLanguage: (lang: Language): void => {
    currentLanguage.value = lang
  },
  toggleLanguage: (): void => {
    currentLanguage.value = currentLanguage.value === 'zh' ? 'en' : 'zh'
  }
})

const messages = {
  zh: {
    connectionParams: '连接参数',
    serialPort: '串口号',
    selectPort: '选择串口',
    baudRate: '波特率',
    dataBits: '数据位',
    parity: '校验位',
    stopBits: '停止位',
    parityNone: '无',
    parityOdd: '奇校验',
    parityEven: '偶校验',
    connect: '打开/连接',
    disconnect: '关闭',
    refreshPort: '刷新串口',
    expand: '展开参数',
    collapse: '收起参数',
    receiveArea: '接收区',
    sendArea: '发送区',
    clear: '清空',
    saveData: '保存数据',
    timestamp: '时间戳',
    preset: '预设',
    appendCrc: '追加CRC',
    crc8: 'CRC8',
    crc16: 'CRC16',
    xor: 'XOR',
    lrc: 'LRC',
    highFirst: '高字节先',
    lowFirst: '低字节先',
    send: '发送',
    hex: 'HEX',
    ascii: 'ASCII',
    placeholderHex: 'AA BB CC DD',
    placeholderAscii: '输入ASCII文本...',
    presetData: '预设数据',
    format: '格式',
    data: '数据',
    delay: '延迟(ms)',
    clickToSend: '点击发送',
    cyclicSend: '循环发送',
    stopSend: '停止发送',
    exportPreset: '导出预设',
    importPreset: '导入预设',
    waitingData: '等待接收数据...',
    connectFirst: '请先建立连接',
    connectSerial: '请先连接串口',
    noDataToSave: '没有数据可保存',
    dataSaved: '数据已保存到: ',
    saveFailed: '保存失败: ',
    exportSuccess: '预设已导出: ',
    exportFailed: '导出失败: ',
    importSuccess: '预设已导入',
    importFailed: '导入失败: ',
    importFormatError: '导入失败: 文件格式错误',
    cyclicSendStopped: '发送失败，循环发送已停止',
    portDisconnected: '串口连接断开: ',
    about: 'OpenSerial - KiraDana v1.0.0',
    statusConnected: '已连接',
    statusConnecting: '连接中...',
    statusDisconnected: '未连接',
    receive: '接收',
    send: '发送'
  },
  en: {
    connectionParams: 'Connection Params',
    serialPort: 'Serial Port',
    selectPort: 'Select Port',
    baudRate: 'Baud Rate',
    dataBits: 'Data Bits',
    parity: 'Parity',
    stopBits: 'Stop Bits',
    parityNone: 'None',
    parityOdd: 'Odd',
    parityEven: 'Even',
    connect: 'Connect',
    disconnect: 'Disconnect',
    refreshPort: 'Refresh Ports',
    expand: 'Expand',
    collapse: 'Collapse',
    receiveArea: 'Receive',
    sendArea: 'Send',
    clear: 'Clear',
    saveData: 'Save Data',
    timestamp: 'Timestamp',
    preset: 'Preset',
    appendCrc: 'Append CRC',
    crc8: 'CRC8',
    crc16: 'CRC16',
    xor: 'XOR',
    lrc: 'LRC',
    highFirst: 'High Byte First',
    lowFirst: 'Low Byte First',
    send: 'Send',
    hex: 'HEX',
    ascii: 'ASCII',
    placeholderHex: 'AA BB CC DD',
    placeholderAscii: 'Enter ASCII text...',
    presetData: 'Preset Data',
    format: 'Format',
    data: 'Data',
    delay: 'Delay(ms)',
    clickToSend: 'Click to Send',
    cyclicSend: 'Cyclic Send',
    stopSend: 'Stop',
    exportPreset: 'Export',
    importPreset: 'Import',
    waitingData: 'Waiting for data...',
    connectFirst: 'Please connect first',
    connectSerial: 'Please connect serial port first',
    noDataToSave: 'No data to save',
    dataSaved: 'Data saved to: ',
    saveFailed: 'Save failed: ',
    exportSuccess: 'Preset exported: ',
    exportFailed: 'Export failed: ',
    importSuccess: 'Preset imported',
    importFailed: 'Import failed: ',
    importFormatError: 'Import failed: Invalid format',
    cyclicSendStopped: 'Send failed, cyclic send stopped',
    portDisconnected: 'Serial port disconnected: ',
    about: 'OpenSerial - KiraDana v1.0.0',
    statusConnected: 'Connected',
    statusConnecting: 'Connecting...',
    statusDisconnected: 'Disconnected',
    receive: 'RX',
    send: 'TX'
  }
}

export function useI18n() {
  const language = computed(() => currentLanguage.value)

  const t = (key: keyof typeof messages.zh): string => {
    return messages[currentLanguage.value][key] || key
  }

  const setLanguage = (lang: Language): void => {
    currentLanguage.value = lang
  }

  const toggleLanguage = (): void => {
    currentLanguage.value = currentLanguage.value === 'zh' ? 'en' : 'zh'
  }

  return {
    language,
    t,
    setLanguage,
    toggleLanguage
  }
}