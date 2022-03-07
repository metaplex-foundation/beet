import {
  BEET_TYPE_ARG_LEN,
  FixedSizeBeet,
  SupportedTypeDefinition,
  ElementCollectionBeet,
  FixableBeet,
  Beet,
} from '../types'
import { strict as assert } from 'assert'
import { u32 } from './numbers'
import { BEET_PACKAGE } from '../types'
import { logTrace } from '../utils'
import { fixBeetFromData, fixBeetFromValue } from '../beet.fixable'

/**
 * De/Serializes an array with a specific number of elements of type {@link T}
 * which all have the same size.
 *
 * @template T type of elements held in the array
 *
 * @param element the De/Serializer for the element type
 * @param len the number of elements in the array
 * @param lenPrefix if `true` a 4 byte number indicating the size of the array
 * will be included before serialized array data
 *
 * @category beet/collection
 */
export function uniformFixedSizeArray<T, V = Partial<T>>(
  element: FixedSizeBeet<T, V>,
  len: number,
  lenPrefix: boolean = false
): ElementCollectionBeet & FixedSizeBeet<T[], V[]> {
  const arraySize = element.byteSize * len
  const byteSize = lenPrefix ? 4 + arraySize : arraySize

  return {
    write: function (buf: Buffer, offset: number, value: V[]): void {
      assert.equal(
        value.length,
        len,
        `array length ${value.length} should match len ${len}`
      )
      if (lenPrefix) {
        u32.write(buf, offset, len)
        offset += 4
      }

      for (let i = 0; i < len; i++) {
        element.write(buf, offset + i * element.byteSize, value[i])
      }
    },

    read: function (buf: Buffer, offset: number): T[] {
      if (lenPrefix) {
        const size = u32.read(buf, offset)
        assert.equal(size, len, 'invalid byte size')
        offset += 4
      }
      const arr: T[] = new Array(len)
      for (let i = 0; i < len; i++) {
        arr[i] = element.read(buf, offset + i * element.byteSize)
      }
      return arr
    },
    byteSize,
    length: len,
    elementByteSize: element.byteSize,
    lenPrefixByteSize: 4,
    description: `Array<${element.description}>(${len})`,
  }
}

/**
 * De/Serializes an array with a specific number of elements of type {@link T}
 * which do not all have the same size.
 *
 * @template T type of elements held in the array
 *
 * @param elements the De/Serializers for the element types
 * @param elementsByteSize size of all elements in the array combined
 *
 * @category beet/collection
 */
export function fixedSizeArray<T, V = Partial<T>>(
  elements: FixedSizeBeet<T, V>[],
  elementsByteSize: number
): FixedSizeBeet<T[], V[]> {
  const len = elements.length
  const firstElement = len === 0 ? '<EMPTY>' : elements[0].description

  return {
    write: function (buf: Buffer, offset: number, value: V[]): void {
      assert.equal(
        value.length,
        len,
        `array length ${value.length} should match len ${len}`
      )
      u32.write(buf, offset, len)

      let cursor = offset + 4
      for (let i = 0; i < len; i++) {
        const element = elements[i]
        element.write(buf, cursor, value[i])
        cursor += element.byteSize
      }
    },

    read: function (buf: Buffer, offset: number): T[] {
      const size = u32.read(buf, offset)
      assert.equal(size, len, 'invalid byte size')

      let cursor = offset + 4
      const arr: T[] = new Array(len)
      for (let i = 0; i < len; i++) {
        const element = elements[i]
        arr[i] = element.read(buf, cursor)
        cursor += element.byteSize
      }
      return arr
    },
    byteSize: 4 + elementsByteSize,
    length: len,
    description: `Array<${firstElement}>(${len})[ 4 + ${elementsByteSize} ]`,
  }
}

/**
 * Wraps an array De/Serializer with with elements of type {@link T} which do
 * not all have the same size.
 *
 * @template T type of elements held in the array
 *
 * @param element the De/Serializer for the element types
 *
 * @category beet/collection
 */
export function array<T, V = Partial<T>>(
  element: Beet<T, V>
): FixableBeet<T[], V[]> {
  return {
    toFixedFromData(buf: Buffer, offset: number): FixedSizeBeet<T[], V[]> {
      const len = u32.read(buf, offset)
      logTrace(`${this.description}[${len}]`)

      const cursorStart = offset + 4
      let cursor = cursorStart

      const fixedElements: FixedSizeBeet<T, V>[] = new Array(len)
      for (let i = 0; i < len; i++) {
        const fixedElement = fixBeetFromData(element, buf, cursor)
        fixedElements[i] = fixedElement
        cursor += fixedElement.byteSize
      }
      return fixedSizeArray(fixedElements, cursor - cursorStart)
    },

    toFixedFromValue(vals: V[]): FixedSizeBeet<T[], V[]> {
      assert(Array.isArray(vals), `${vals} should be an array`)

      let elementsSize = 0
      const fixedElements: FixedSizeBeet<T, V>[] = new Array(vals.length)

      for (let i = 0; i < vals.length; i++) {
        const fixedElement = fixBeetFromValue(element, vals[i])
        fixedElements[i] = fixedElement
        elementsSize += fixedElement.byteSize
      }
      return fixedSizeArray(fixedElements, elementsSize)
    },

    description: `array`,
  }
}

/**
 * A De/Serializer for raw {@link Buffer}s that just copies/reads the buffer bytes
 * to/from the provided buffer.
 *
 * @param bytes the byte size of the buffer to de/serialize
 * @category beet/collection
 */
export function fixedSizeBuffer(bytes: number): FixedSizeBeet<Buffer> {
  return {
    write: function (buf: Buffer, offset: number, value: Buffer): void {
      value.copy(buf, offset, 0, bytes)
    },
    read: function (buf: Buffer, offset: number): Buffer {
      return buf.slice(offset, offset + bytes)
    },

    byteSize: bytes,
    description: `Buffer(len)`,
  }
}

/**
 * A De/Serializer for {@link Uint8Array}s that just copies/reads the array bytes
 * to/from the provided buffer.
 *
 * @category beet/collection
 */
export function fixedSizeUint8Array(len: number): FixedSizeBeet<Uint8Array> {
  const arrayBufferBeet = fixedSizeBuffer(len)
  return {
    write: function (buf: Buffer, offset: number, value: Uint8Array): void {
      const valueBuf = Buffer.from(value)
      arrayBufferBeet.write(buf, offset, valueBuf)
    },
    read: function (buf: Buffer, offset: number): Uint8Array {
      const arrayBuffer = arrayBufferBeet.read(buf, offset)
      return Uint8Array.from(arrayBuffer)
    },

    byteSize: len,
    description: `Uint8Array(len)`,
  }
}

/**
 * @category TypeDefinition
 */
export type CollectionsExports = keyof typeof import('./collections')
/**
 * @category TypeDefinition
 */
export type CollectionsTypeMapKey =
  | 'Array'
  | 'FixedSizeArray'
  | 'UniformFixedSizeArray'
  | 'Buffer'
  | 'Uint8Array'
/**
 * @category TypeDefinition
 */
export type CollectionsTypeMap = Record<
  CollectionsTypeMapKey,
  SupportedTypeDefinition & { beet: CollectionsExports }
>

/**
 * Maps collections beet exports to metadata which describes in which package it
 * is defined as well as which TypeScript type is used to represent the
 * deserialized value in JavaScript.
 *
 * @category TypeDefinition
 */
export const collectionsTypeMap: CollectionsTypeMap = {
  Array: {
    beet: 'array',
    isFixable: true,
    sourcePack: BEET_PACKAGE,
    ts: 'Array',
    arg: BEET_TYPE_ARG_LEN,
  },
  FixedSizeArray: {
    beet: 'fixedSizeArray',
    isFixable: false,
    sourcePack: BEET_PACKAGE,
    ts: 'Array',
    arg: BEET_TYPE_ARG_LEN,
  },
  UniformFixedSizeArray: {
    beet: 'uniformFixedSizeArray',
    isFixable: false,
    sourcePack: BEET_PACKAGE,
    ts: 'Array',
    arg: BEET_TYPE_ARG_LEN,
  },
  Buffer: {
    beet: 'fixedSizeBuffer',
    isFixable: false,
    sourcePack: BEET_PACKAGE,
    ts: 'Buffer',
    arg: BEET_TYPE_ARG_LEN,
  },
  Uint8Array: {
    beet: 'fixedSizeUint8Array',
    isFixable: false,
    sourcePack: BEET_PACKAGE,
    ts: 'Uint8Array',
    arg: BEET_TYPE_ARG_LEN,
  },
}
