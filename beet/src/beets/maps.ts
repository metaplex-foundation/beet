import { ElementCollectionBeet, FixedSizeBeet } from '../types'
import { u32 } from './numbers'
import { strict as assert } from 'assert'

export function fixedSizeMap<T extends keyof any, V>(
  keyElement: FixedSizeBeet<T>,
  valElement: FixedSizeBeet<V>,
  len: number
): ElementCollectionBeet & FixedSizeBeet<Map<T, V>, Map<T, V>> {
  const mapSize = (keyElement.byteSize + valElement.byteSize) * len
  const byteSize = 4 + mapSize

  // @ts-ignore types are tricky here
  return {
    write: function (buf: Buffer, offset: number, map: Map<T, V>): void {
      // Write the values first and then the size as it comes clear while we do the former
      let cursor = offset + 4

      let size = 0
      for (const [k, v] of map.entries()) {
        size++
        keyElement.write(buf, cursor, k)
        cursor += keyElement.byteSize

        valElement.write(buf, cursor, v)
        cursor += valElement.byteSize
      }
      u32.write(buf, offset, size)

      assert.equal(
        size,
        len,
        `Expected map to have size ${len}, but has ${size}.`
      )
    },

    read: function (buf: Buffer, offset: number): Map<T, V> {
      const size = u32.read(buf, offset)
      assert.equal(
        size,
        len,
        `Expected map to have size ${len}, but has ${size}.`
      )

      let cursor = offset + 4

      const map: Map<T, V> = new Map()

      for (let i = 0; i < size; i++) {
        const k = keyElement.read(buf, cursor)
        cursor += keyElement.byteSize

        const v = valElement.read(buf, cursor)
        cursor += valElement.byteSize

        map.set(k, v)
      }

      return map
    },

    byteSize,
    length: len,
    lenPrefixByteSize: 4,
    description: `Map<${keyElement.description}, ${valElement.description}>`,
  }
}
