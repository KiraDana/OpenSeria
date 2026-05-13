export class CrcUtils {
  static crc8(data: Uint8Array): number {
    let crc = 0x00
    const polynomial = 0x07

    for (let i = 0; i < data.length; i++) {
      crc ^= data[i]
      for (let j = 0; j < 8; j++) {
        if (crc & 0x80) {
          crc = (crc << 1) ^ polynomial
        } else {
          crc <<= 1
        }
        crc &= 0xFF
      }
    }

    return crc
  }

  static crc8Buffer(buffer: ArrayLike<number>): number {
    const arr = new Uint8Array(buffer)
    return this.crc8(arr)
  }

  static crc16Modbus(data: Uint8Array): number {
    let crc = 0xFFFF

    for (let i = 0; i < data.length; i++) {
      crc ^= data[i]
      for (let j = 0; j < 8; j++) {
        if (crc & 0x0001) {
          crc = (crc >> 1) ^ 0xA001
        } else {
          crc >>= 1
        }
      }
    }

    return crc
  }

  static crc16ModbusBuffer(buffer: ArrayLike<number>): number {
    const arr = new Uint8Array(buffer)
    return this.crc16Modbus(arr)
  }

  static crc16ModbusBytes(dataHex: string): number {
    const data = this.hexToBytes(dataHex)
    return this.crc16ModbusBuffer(data)
  }

  static xorChecksum(data: Uint8Array): number {
    let result = 0
    for (let i = 0; i < data.length; i++) {
      result ^= data[i]
    }
    return result
  }

  static xorChecksumBuffer(buffer: ArrayLike<number>): number {
    const arr = new Uint8Array(buffer)
    return this.xorChecksum(arr)
  }

  static xorChecksumHex(dataHex: string): number {
    const data = this.hexToBytes(dataHex)
    return this.xorChecksumBuffer(data)
  }

  static lrcChecksum(data: Uint8Array): number {
    let lrc = 0
    for (let i = 0; i < data.length; i++) {
      lrc = (lrc + data[i]) & 0xFF
    }
    lrc = ((lrc ^ 0xFF) + 1) & 0xFF
    return lrc
  }

  static lrcChecksumBuffer(buffer: ArrayLike<number>): number {
    const arr = new Uint8Array(buffer)
    return this.lrcChecksum(arr)
  }

  static lrcChecksumHex(dataHex: string): number {
    const data = this.hexToBytes(dataHex)
    return this.lrcChecksumBuffer(data)
  }

  static hexToBytes(hex: string): Uint8Array {
    const cleanHex = hex.replace(/\s/g, '')
    const bytes: number[] = []
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes.push(parseInt(cleanHex.substring(i, i + 2), 16))
    }
    return new Uint8Array(bytes)
  }

  static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(' ')
  }

  static calculateCRC(dataHex: string, type: string, byteOrder: string = 'low-first'): string {
    const data = this.hexToBytes(dataHex)
    let result: number

    switch (type) {
      case 'crc8':
        result = this.crc8Buffer(data)
        return result.toString(16).toUpperCase().padStart(2, '0')
      case 'crc16':
        result = this.crc16ModbusBuffer(data)
        if (byteOrder === 'high-first') {
          return ((result >> 8) & 0xFF).toString(16).toUpperCase().padStart(2, '0') +
                 (result & 0xFF).toString(16).toUpperCase().padStart(2, '0')
        } else {
          return (result & 0xFF).toString(16).toUpperCase().padStart(2, '0') +
                 ((result >> 8) & 0xFF).toString(16).toUpperCase().padStart(2, '0')
        }
      case 'xor':
        result = this.xorChecksumBuffer(data)
        return result.toString(16).toUpperCase().padStart(2, '0')
      case 'lrc':
        result = this.lrcChecksumBuffer(data)
        return result.toString(16).toUpperCase().padStart(2, '0')
      default:
        return ''
    }
  }
}
