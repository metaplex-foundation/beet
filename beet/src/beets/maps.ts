import {
  Beet,
  BEET_PACKAGE,
  ElementCollectionBeet,
  FixableBeet,
  FixedSizeBeet,
  isFixedSizeBeet,
  SupportedTypeDefinition,
} from '../types'
import { u32 } from './numbers'
import { strict as assert } from 'assert'

/**
 * De/Serializes a map with a specific number of key/values of type {@link K}
 * and {@link V} respectively.
 *
 * NOTE: that it is not exported as no fixed size map exists but will have to
 * be derived from data or value instead.
 *
 * @template K type of key elements held in the map
 * @template V type of value elements held in the map
 *
 * @param keyElement the De/Serializers for the key element types
 * @param valElement the De/Serializers for the value element types
 * @param len amount of entries in the map
 *
 * @category beet/composite
 * @private
 */
function fixedSizeMap<K extends keyof any, V>(
  keyElement: Beet<K, K>,
  valElement: Beet<V, V>,
  fixedElements: Map<K, [FixedSizeBeet<K>, FixedSizeBeet<V>]>,
  len: number
): ElementCollectionBeet & FixedSizeBeet<Map<K, V>, Map<K, V>> {
  const keyElementFixed = isFixedSizeBeet(keyElement)
  const valElementFixed = isFixedSizeBeet(valElement)

  function determineSizes() {
    if (keyElementFixed && valElementFixed) {
      const elementByteSize = keyElement.byteSize + valElement.byteSize
      return {
        elementByteSize,
        byteSize: 4 + len * elementByteSize,
      }
    } else if (keyElementFixed) {
      let valsByteSize = 0
      for (const [_, v] of fixedElements.values()) {
        valsByteSize += v.byteSize
      }
      // If any element has a dynamic size all we can do here is take an average
      const elementByteSize =
        keyElement.byteSize + Math.ceil(valsByteSize / len)

      return {
        elementByteSize,
        byteSize: 4 + keyElement.byteSize * len + valsByteSize,
      }
    } else if (valElementFixed) {
      let keysByteSize = 0
      for (const [k, _] of fixedElements.values()) {
        keysByteSize += k.byteSize
      }
      const elementByteSize =
        Math.ceil(keysByteSize / len) + valElement.byteSize

      return {
        elementByteSize,
        byteSize: 4 + keysByteSize + valElement.byteSize * len,
      }
    } else {
      let keysByteSize = 0
      let valsByteSize = 0
      for (const [k, v] of fixedElements.values()) {
        keysByteSize += k.byteSize
        valsByteSize += v.byteSize
      }
      const elementByteSize = Math.ceil(keysByteSize / len + valsByteSize / len)
      return {
        elementByteSize,
        byteSize: 4 + keysByteSize + valsByteSize,
      }
    }
  }

  const { elementByteSize, byteSize } = determineSizes()

  return {
    write: function (buf: Buffer, offset: number, map: Map<K, V>): void {
      // Write the values first and then the size as it comes clear while we do the former
      let cursor = offset + 4

      let size = 0
      for (const [k, v] of map.entries()) {
        let fixedKey = keyElementFixed ? keyElement : null
        let fixedVal = valElementFixed ? valElement : null

        if (fixedKey == null || fixedVal == null) {
          // When we write the value we know the key and an just pull the
          // matching fixed beet for key/val from the provided map which is
          // faster than fixing it by value
          const els = fixedElements.get(k)
          assert(
            els != null,
            `Should be able to find beet els for ${k.toString()}, but could not`
          )
          fixedKey ??= els[0]
          fixedVal ??= els[1]
        }

        fixedKey.write(buf, cursor, k)
        cursor += fixedKey.byteSize

        fixedVal.write(buf, cursor, v)
        cursor += fixedVal.byteSize

        size++
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
        // When we read the value from a buffer we don't know the key we're
        // reading yet and thus cannot use the provided map of fixed
        // de/serializers.
        // Therefore we obtain it by fixing it by data instead.
        const fixedKey = keyElementFixed
          ? keyElement
          : keyElement.toFixedFromData(buf, cursor)
        const k = fixedKey.read(buf, cursor)
        cursor += fixedKey.byteSize

        const fixedVal = valElementFixed
          ? valElement
          : valElement.toFixedFromData(buf, cursor)
        const v = fixedVal.read(buf, cursor)
        cursor += fixedVal.byteSize

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

/**
 * De/Serializes a map with a specific number of key/values of type {@link K}
 * and {@link V} respectively.
 *
 * @template K type of key elements held in the map
 * @template V type of value elements held in the map
 *
 * @param keyElement the _fixable_ or _fixed_ de/serializers for the key element types
 * @param valElement the _fixable_ or _fixed_ de/serializers for the value element types
 *
 * @category beet/composite
 */
export function map<K extends keyof any, V>(
  keyElement: Beet<K, K>,
  valElement: Beet<V, V>
): FixableBeet<Map<K, V>, Map<K, V>> {
  const keyIsFixed = isFixedSizeBeet(keyElement)
  const valIsFixed = isFixedSizeBeet(valElement)
  return {
    toFixedFromData(
      buf: Buffer,
      offset: number
    ): ElementCollectionBeet & FixedSizeBeet<Map<K, V>, Map<K, V>> {
      const len = u32.read(buf, offset)
      let cursor = offset + 4

      // Shortcut for the case that both key and value are fixed size beets
      if (keyIsFixed && valIsFixed) {
        return fixedSizeMap(keyElement, valElement, new Map(), len)
      }

      // If either key or val are not fixed size beets we need to determine the
      // fixed versions and add them to a map by key
      const fixedBeets: Map<K, [FixedSizeBeet<K>, FixedSizeBeet<V>]> = new Map()
      for (let i = 0; i < len; i++) {
        const keyFixed = keyIsFixed
          ? keyElement
          : keyElement.toFixedFromData(buf, cursor)
        const key = keyFixed.read(buf, cursor)
        cursor += keyFixed.byteSize

        const valFixed = valIsFixed
          ? valElement
          : valElement.toFixedFromData(buf, cursor)
        cursor += valFixed.byteSize

        fixedBeets.set(key, [keyFixed, valFixed])
      }
      return fixedSizeMap(keyElement, valElement, fixedBeets, len)
    },

    toFixedFromValue(
      mapVal: Map<K, V>
    ): ElementCollectionBeet & FixedSizeBeet<Map<K, V>, Map<K, V>> {
      const len = mapVal.size
      // As above shortcut for the optimal case and build a map for all others
      if (keyIsFixed && valIsFixed) {
        return fixedSizeMap(keyElement, valElement, new Map(), len)
      }
      const fixedBeets: Map<K, [FixedSizeBeet<K>, FixedSizeBeet<V>]> = new Map()
      for (const [k, v] of mapVal) {
        const keyFixed = keyIsFixed
          ? keyElement
          : keyElement.toFixedFromValue(k)
        const valFixed = valIsFixed
          ? valElement
          : valElement.toFixedFromValue(v)
        fixedBeets.set(k, [keyFixed, valFixed])
      }
      return fixedSizeMap(keyElement, valElement, fixedBeets, len)
    },

    description: `FixableMap<${keyElement.description}, ${valElement.description}>`,
  }
}

/**
 * @category TypeDefinition
 */
export type MapsExports = keyof Omit<typeof import('./maps'), 'mapsTypeMap'>

/**
 * @category TypeDefinition
 */
export type MapsTypeMapKey = 'Map'

/**
 * @category TypeDefinition
 */
export type MapsTypeMap = Record<
  MapsTypeMapKey,
  SupportedTypeDefinition & { beet: MapsExports }
>

/**
 * Maps maps beet exports to metadata which describes in which package it
 * is defined as well as which TypeScript type is used to represent the
 * deserialized value in JavaScript.
 *
 * @category TypeDefinition
 */
export const mapsTypeMap: MapsTypeMap = {
  Map: {
    beet: 'map',
    isFixable: true,
    sourcePack: BEET_PACKAGE,
    ts: 'Map',
  },
}
