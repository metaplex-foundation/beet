import { Beet } from './types'
import { strict as assert } from 'assert'
import { u32 } from './numbers'

export const fixedSizeUtf8String: (stringByteLength: number) => Beet<string> = (
  stringByteLength: number
) => {
  return {
    write: function (buf: Buffer, offset: number, value: string) {
      const stringBuf = Buffer.from(value, 'utf8')
      assert.equal(
        stringBuf.byteLength,
        stringByteLength,
        `${value} has invalid byte size`
      )
      u32.write(buf, offset, stringByteLength)
      stringBuf.copy(buf, offset + 4, 0, stringByteLength)
    },

    read: function (buf: Buffer, offset: number): string {
      const size = u32.read(buf, offset)
      assert.equal(size, stringByteLength, `invalid byte size`)
      const stringSlice = buf.slice(offset + 4, offset + 4 + stringByteLength)
      return stringSlice.toString('utf8')
    },
    byteSize: 4 + stringByteLength,
    description: 'primitive: fixed size utf8 string',
  }
}

export function fixedSizeArray<T>(element: Beet<T>, len: number): Beet<T[]> {
  return {
    write: function (buf: Buffer, offset: number, value: T[]): void {
      assert.equal(
        value.length,
        len,
        `array length ${value.length} should match len ${len}`
      )
      u32.write(buf, offset, len)
      for (let i = 0; i < len; i++) {
        element.write(buf, offset + 4 + i * element.byteSize, value[i])
      }
    },
    read: function (buf: Buffer, offset: number): T[] {
      const size = u32.read(buf, offset)
      assert.equal(size, len, 'invalid byte size')
      const arr: T[] = new Array(len)
      for (let i = 0; i < len; i++) {
        arr[i] = element.read(buf, offset + 4 + i * element.byteSize)
      }
      return arr
    },
    byteSize: 4 + element.byteSize * len,
    description: `collection: Array of ${element.description}`,
  }
}

export function fixedSizeBuffer(bytes: number): Beet<Buffer> {
  return {
    write: function (buf: Buffer, offset: number, value: Buffer): void {
      u32.write(buf, offset, bytes)
      value.copy(buf, offset + 4, 0, bytes)
    },
    read: function (buf: Buffer, offset: number): Buffer {
      const size = u32.read(buf, offset)
      assert.equal(size, bytes, 'invalid byte size')
      return buf.slice(offset + 4, offset + 4 + bytes)
    },

    byteSize: 4 + bytes,
    description: 'collection: Buffer',
  }
}

export function fixedSizeUint8Array(len: number): Beet<Uint8Array> {
  return {
    write: function (buf: Buffer, offset: number, value: Uint8Array): void {
      const valueBuf = Buffer.from(value)
      fixedSizeBuffer(len).write(buf, offset, valueBuf)
    },
    read: function (buf: Buffer, offset: number): Uint8Array {
      const arrayBuffer = fixedSizeBuffer(len).read(buf, offset)
      return Uint8Array.from(arrayBuffer)
    },

    byteSize: 4 + len,
    description: 'collection: Uint8Array',
  }
}
