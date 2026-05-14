const rcedit = require('rcedit')
const path = require('path')
const fs = require('fs')

const exePath = path.join(__dirname, '..', 'dist-electron', 'win-unpacked', 'OpenSerial.exe')
const icoPath = path.join(__dirname, '..', 'src', 'assets', 'icon.ico')

if (!fs.existsSync(exePath)) {
  console.error('未找到 exe:', exePath)
  process.exit(1)
}

if (!fs.existsSync(icoPath)) {
  console.error('未找到 ico:', icoPath)
  process.exit(1)
}

rcedit.rcedit(exePath, { icon: icoPath })
  .then(() => console.log('图标已应用到:', exePath))
  .catch(err => console.error('图标应用失败:', err))
