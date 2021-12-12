import { strict as assert } from 'assert'
import { Beet } from './types'

export type COption<T> = T | null

const SOME = Buffer.from(Uint8Array.from([1, 0, 0, 0])).slice(0, 4)
const NONE = Buffer.from(Uint8Array.from([0, 0, 0, 0])).slice(0, 4)

export function coption<T>(inner: Beet<T>): Beet<COption<T>> {
  return {
    write: function (buf: Buffer, offset: number, value: COption<T>) {
      if (value == null) {
        NONE.copy(buf, offset, 0, 4)
        // NOTE: here we leave the remaining part of the buffer unchanged
        // as it won't be consumed on read either.
        // Also it should be zero filled already.
      } else {
        SOME.copy(buf, offset, 0, 4)
        inner.write(buf, offset + 4, value)
      }
    },

    read: function (buf: Buffer, offset: number): COption<T> {
      if (buf.compare(NONE, 0, 4, offset, offset + 4) === 0) {
        return null
      }
      assert(
        buf.compare(SOME, 0, 4, offset, offset + 4) === 0,
        'should be valid COption buffer'
      )
      return inner.read(buf, offset + 4)
    },
    byteSize: 4 + inner.byteSize,
    description: `COption<${inner.description}>`,
  }
}
