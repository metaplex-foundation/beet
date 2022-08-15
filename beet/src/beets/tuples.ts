// Tuples are a special kind of composite which can be understood as
// fixed length arrays where each data type can have a different data type
// Since the Tuple type itself dictates the length, and buffer layout, no extra
// information is included in the serialized data.

import { FixedSizeBeet } from 'src/types'
import { strict as assert } from 'assert'

// If all inner tuple types are fixed size so is the tuple itself, otherwise it is fixable
export function fixedSizeTuple<T extends any[]>(
  elements: FixedSizeBeet<any>[]
): FixedSizeBeet<any> {
  const len = elements.length
  const elDescs = elements.map((x) => x.description)
  const byteSizes = elements.map((x) => x.byteSize)
  const byteSize = byteSizes.reduce((acc, x) => acc + x, 0)

  return {
    write: function (buf: Buffer, offset: number, value: T): void {
      assert.equal(
        value.length,
        len,
        `tuple value element size ${value.length} should match len ${len}`
      )
      let cursor = offset
      for (let i = 0; i < len; i++) {
        const v = value[i]
        const beetEl = elements[i]
        beetEl.write(buf, cursor, v)
        cursor += beetEl.byteSize
      }
    },

    read: function (buf: Buffer, offset: number): T {
      const els = []
      let cursor = offset
      for (let i = 0; i < len; i++) {
        const elBeet = elements[i]
        els[i] = elBeet.read(buf, cursor)
        cursor += elBeet.byteSize
      }
      return els as T
    },

    byteSize,
    length: len,
    description: `Tuple<${elDescs.join(',')}>[ ${byteSizes.join(', ')} ]`,
  }
}
