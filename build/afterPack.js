const rcedit = require('rcedit')
const path = require('path')

exports.default = async function (context) {
  const exePath = path.join(context.appOutDir, 'OpenSerial.exe')
  const icoPath = path.join(context.packager.info.appDir, 'src', 'assets', 'icon.ico')
  try {
    await rcedit.rcedit(exePath, { icon: icoPath })
    console.log('afterPack: 图标已应用到', exePath)
  } catch (err) {
    console.error('afterPack: 图标应用失败', err)
  }
}
