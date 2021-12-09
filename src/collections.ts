import { Borsh } from './types'
import { strict as assert } from 'assert'

export const fixedSizeUtf8String: (
  stringByteLength: number
) => Borsh<string> = (stringByteLength: number) => {
  return {
    write: function (buf: Buffer, offset: number, value: string) {
      const stringBuf = Buffer.from(value)
      assert.equal(
        stringBuf.byteLength,
        stringByteLength,
        `${value} has invalid byte size`
      )
      buf.writeUInt32LE(stringByteLength, offset)
      stringBuf.copy(buf, offset + 4, 0, stringByteLength)
    },

    read: function (buf: Buffer, offset: number): string {
      const sizeSlice = buf.slice(offset, offset + 4)
      const containedSize = sizeSlice.readUInt32LE(offset)
      assert.equal(
        containedSize,
        stringByteLength,
        `${sizeSlice.toString('utf8')} has invalid byte size`
      )
      const stringSlice = buf.slice(offset + 4, offset + 4 + stringByteLength)
      return stringSlice.toString('utf8')
    },
    byteSize: 4 + stringByteLength,
    description: 'primitive: sized utf8 string',
  }
}
