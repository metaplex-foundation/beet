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
import { stringify } from '../utils'
import { strict as assert } from 'assert'

/**
 * De/Serializes a set with a specific number of keys of type {@link K}.
 *
 * NOTE: that it is not exported as no fixed size set exists but will have to
 * be derived from data or value instead.
 *
 * @template K type of key elements held in the set
 *
 * @param keyElement the De/Serializers for the key element types
 * @param len amount of entries in the set
 *
 * @category beet/composite
 * @private
 */
function fixedSizeSet<K>(
  keyElement: Beet<K, K>,
  fixedElements: Map<K, FixedSizeBeet<K>>,
  len: number
): ElementCollectionBeet & FixedSizeBeet<Set<K>, Set<K>> {
  const keyElementFixed = isFixedSizeBeet(keyElement)

  function determineSizes() {
    if (keyElementFixed) {
      const elementByteSize = keyElement.byteSize
      return {
        elementByteSize,
        byteSize: 4 + len * elementByteSize,
      }
    } else {
      let keysByteSize = 0
      for (const k of fixedElements.values()) {
        keysByteSize += k.byteSize
      }
      const elementByteSize = Math.ceil(keysByteSize / len)
      return {
        elementByteSize,
        byteSize: 4 + keysByteSize,
      }
    }
  }

  const { elementByteSize, byteSize } = determineSizes()

  return {
    write: function (buf: Buffer, offset: number, set: Set<K>): void {
      // Write the values first and then the size as it comes clear while we do the former
      let cursor = offset + 4

      let size = 0
      for (const k of set.keys()) {
        let fixedKey = keyElementFixed ? keyElement : null

        if (fixedKey == null) {
          // When we write the value we know the key and an just pull the
          // matching fixed beet for key from the provided set which is
          // faster than fixing it by value
          const el = fixedElements.get(k)
          assert(
            el != null,
            `Should be able to find beet el for ${stringify(k)}, but could not`
          )
          fixedKey ??= el
        }

        fixedKey.write(buf, cursor, k)
        cursor += fixedKey.byteSize

        size++
      }
      u32.write(buf, offset, size)

      assert.equal(
        size,
        len,
        `Expected set to have size ${len}, but has ${size}.`
      )
    },

    read: function (buf: Buffer, offset: number): Set<K> {
      const size = u32.read(buf, offset)
      assert.equal(
        size,
        len,
        `Expected set to have size ${len}, but has ${size}.`
      )

      let cursor = offset + 4

      const set: Set<K> = new Set()

      for (let i = 0; i < size; i++) {
        // When we read the value from a buffer we don't know the key we're
        // reading yet and thus cannot use the provided set of fixed
        // de/serializers.
        // Therefore we obtain it by fixing it by data instead.
        const fixedKey = keyElementFixed
          ? keyElement
          : keyElement.toFixedFromData(buf, cursor)
        const k = fixedKey.read(buf, cursor)
        cursor += fixedKey.byteSize

        set.add(k)
      }

      return set
    },

    elementByteSize,
    byteSize,
    length: len,
    lenPrefixByteSize: 4,
    description: `Set<${keyElement.description}>`,
  }
}

/**
 * De/Serializes a set with a specific number of keys of type {@link K}
 *
 * @template K type of key elements held in the set
 *
 * @param keyElement the _fixable_ or _fixed_ de/serializers for the key element types
 *
 * @category beet/composite
 */
export function set<K>(keyElement: Beet<K, K>): FixableBeet<Set<K>, Set<K>> {
  const keyIsFixed = isFixedSizeBeet(keyElement)
  return {
    toFixedFromData(
      buf: Buffer,
      offset: number
    ): ElementCollectionBeet & FixedSizeBeet<Set<K>, Set<K>> {
      const len = u32.read(buf, offset)
      let cursor = offset + 4

      // Shortcut for the case that both key and value are fixed size beets
      if (keyIsFixed) {
        return fixedSizeSet<K>(keyElement, new Map(), len)
      }

      // If key is not fixed size beet we need to determine the fixed versions and add them to a set by key
      const fixedBeets: Map<K, FixedSizeBeet<K>> = new Map()
      for (let i = 0; i < len; i++) {
        const keyFixed = keyIsFixed
          ? keyElement
          : keyElement.toFixedFromData(buf, cursor)
        const key = keyFixed.read(buf, cursor)
        cursor += keyFixed.byteSize

        fixedBeets.set(key, keyFixed)
      }
      return fixedSizeSet(keyElement, fixedBeets, len)
    },

    toFixedFromValue(
      setVal: Set<K>
    ): ElementCollectionBeet & FixedSizeBeet<Set<K>, Set<K>> {
      const len = setVal.size
      // As above shortcut for the optimal case and build a set for all others
      if (keyIsFixed) {
        return fixedSizeSet<K>(keyElement, new Map(), len)
      }
      const fixedBeets: Map<K, FixedSizeBeet<K>> = new Map()
      for (const k of setVal) {
        const keyFixed = keyIsFixed
          ? keyElement
          : keyElement.toFixedFromValue(k)
        fixedBeets.set(k, keyFixed)
      }
      return fixedSizeSet(keyElement, fixedBeets, len)
    },

    description: `FixableSet<${keyElement.description}>`,
  }
}

/**
 * @category TypeDefinition
 */
export type SetsExports = keyof Omit<typeof import('./sets'), 'setsTypeSet'>

/**
 * @category TypeDefinition
 */
export type SetsTypeMapKey = 'Set'

/**
 * @category TypeDefinition
 */
export type SetsTypeMap = Record<
  SetsTypeMapKey,
  SupportedTypeDefinition & { beet: SetsExports }
>

/**
 * Sets sets beet exports to metadata which describes in which package it
 * is defined as well as which TypeScript type is used to represent the
 * deserialized value in JavaScript.
 *
 * @category TypeDefinition
 */
export const setsTypeMap: SetsTypeMap = {
  Set: {
    beet: 'set',
    isFixable: true,
    sourcePack: BEET_PACKAGE,
    ts: 'Set',
  },
}
