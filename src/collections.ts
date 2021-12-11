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
      assert.equal(size, len, `invalid byte size`)
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
