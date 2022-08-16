import { ElementCollectionBeet, FixableBeet, FixedSizeBeet } from '../types'
import { u32 } from './numbers'
import { strict as assert } from 'assert'

/**
 * De/Serializes a map with a specific number of key/values of type {@link K}
 * and {@link V} respectively.
 *
 * NOTE: that it is not exported as no fixed size map exists but will have to
 * be derived from data or value instead.
 *
 * @template K type of elements held in the array
 *
 * @param keyElement the De/Serializers for the key element types
 * @param valElement the De/Serializers for the value element types
 * @param len amount of entries in the map
 *
 * @category beet/collection
 * @private
 */
function fixedSizeMap<K extends keyof any, V>(
  keyElement: FixedSizeBeet<K>,
  valElement: FixedSizeBeet<V>,
  len: number
): ElementCollectionBeet & FixedSizeBeet<Map<K, V>, Map<K, V>> {
  const elementByteSize = keyElement.byteSize + valElement.byteSize
  const mapSize = elementByteSize * len
  const byteSize = 4 + mapSize

  return {
    write: function (buf: Buffer, offset: number, map: Map<K, V>): void {
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

    read: function (buf: Buffer, offset: number): Map<K, V> {
      const size = u32.read(buf, offset)
      assert.equal(
        size,
        len,
        `Expected map to have size ${len}, but has ${size}.`
      )

      let cursor = offset + 4

      const map: Map<K, V> = new Map()

      for (let i = 0; i < size; i++) {
        const k = keyElement.read(buf, cursor)
        cursor += keyElement.byteSize

        const v = valElement.read(buf, cursor)
        cursor += valElement.byteSize

        map.set(k, v)
      }

      return map
    },

    elementByteSize,
    byteSize,
    length: len,
    lenPrefixByteSize: 4,
    description: `Map<${keyElement.description}, ${valElement.description}>`,
  }
}

export function map<K extends keyof any, V>(
  keyElement: FixedSizeBeet<K>,
  valElement: FixedSizeBeet<V>
): FixableBeet<Map<K, V>, Map<K, V>> {
  return {
    toFixedFromData(
      buf: Buffer,
      offset: number
    ): ElementCollectionBeet & FixedSizeBeet<Map<K, V>, Map<K, V>> {
      const len = u32.read(buf, offset)
      return fixedSizeMap(keyElement, valElement, len)
    },
    toFixedFromValue(
      val: Map<K, V>
    ): ElementCollectionBeet & FixedSizeBeet<Map<K, V>, Map<K, V>> {
      const len = val.size
      return fixedSizeMap(keyElement, valElement, len)
    },
    description: `FixableMap<${keyElement.description}, ${valElement.description}>`,
  }
}
