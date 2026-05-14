const fs = require('fs')
const path = require('path')

const W = 256, H = 256
const cx = W / 2, cy = H / 2, r = W / 2 - 8

const andRowStride = Math.ceil(W / 32) * 4
const andMaskSize = andRowStride * H
const pixelSize = W * H * 4
const bmpSize = 40 + pixelSize + andMaskSize
const headerSize = 6 + 16
const fileSize = headerSize + bmpSize

const buf = Buffer.alloc(fileSize)
let off = 0

buf.writeUInt16LE(0, off); off += 2
buf.writeUInt16LE(1, off); off += 2
buf.writeUInt16LE(1, off); off += 2

buf.writeUInt8(0, off); off += 1
buf.writeUInt8(0, off); off += 1
buf.writeUInt8(0, off); off += 1
buf.writeUInt8(0, off); off += 1
buf.writeUInt16LE(1, off); off += 2
buf.writeUInt16LE(32, off); off += 2
buf.writeUInt32LE(bmpSize, off); off += 4
buf.writeUInt32LE(headerSize, off); off += 4

buf.writeUInt32LE(40, off); off += 4
buf.writeInt32LE(W, off); off += 4
buf.writeInt32LE(H * 2, off); off += 4
buf.writeUInt16LE(1, off); off += 2
buf.writeUInt16LE(32, off); off += 2
buf.writeUInt32LE(0, off); off += 4
buf.writeUInt32LE(pixelSize, off); off += 4
buf.writeInt32LE(0, off); off += 4
buf.writeInt32LE(0, off); off += 4
buf.writeUInt32LE(0, off); off += 4
buf.writeUInt32LE(0, off); off += 4

const r2 = r * r
for (let y = H - 1; y >= 0; y--) {
  for (let x = 0; x < W; x++) {
    const dx = x - cx, dy = y - cy
    if (dx * dx + dy * dy <= r2) {
      buf[off] = 241; off += 1
      buf[off] = 102; off += 1
      buf[off] = 99;  off += 1
      buf[off] = 255; off += 1
    } else {
      buf.writeUInt32LE(0, off); off += 4
    }
  }
}

off += andMaskSize

const outPath = path.join(__dirname, '..', 'src', 'assets', 'icon.ico')
fs.writeFileSync(outPath, buf)
console.log('ICO generated:', outPath, `(${fileSize} bytes)`)
