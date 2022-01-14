import {
  BEET_TYPE_ARG_LEN,
  FixedSizeBeet,
  SupportedTypeDefinition,
  Collection,
} from '../types'
import { strict as assert } from 'assert'
import { u32 } from './numbers'
import { BEET_PACKAGE } from '../types'

/**
 * De/Serializes a UTF8 string of a particular size.
 *
 * @param stringByteLength the number of bytes of the string
 *
 * @category beet/collection
 */
export const fixedSizeUtf8String: (
  stringByteLength: number
) => FixedSizeBeet<string> = (stringByteLength: number) => {
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
    elementByteSize: 1,
    len: stringByteLength,
    lenPrefixByteSize: 4,
    byteSize: 4 + stringByteLength,
    description: `Utf8String(${stringByteLength})`,
  }
}

/**
 * De/Serializes an array with a specific number of elements of type {@link T}.
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
export function fixedSizeArray<T, V = Partial<T>>(
  element: FixedSizeBeet<T, V>,
  len: number,
  lenPrefix: boolean = false
): Collection<T[], V[]> & FixedSizeBeet<T[], V[]> {
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
    lenPrefixByteSize: 4,
    description: `Array<${element.description}>(${len})`,

    // Composite
    get inner(): FixedSizeBeet<T, Partial<T>> {
      return element
    },

    withFixedSizeInner(inner: FixedSizeBeet<T>) {
      return fixedSizeArray(inner, len, lenPrefix)
    },
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
export type CollectionsTypeMapKey = 'string' | 'Array' | 'Buffer' | 'Uint8Array'
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
// prettier-ignore
export const collectionsTypeMap: CollectionsTypeMap = {
  string     : { beet: 'fixedSizeUtf8String', sourcePack: BEET_PACKAGE, ts: 'string',     arg: BEET_TYPE_ARG_LEN },
  Array      : { beet: 'fixedSizeArray',      sourcePack: BEET_PACKAGE, ts: 'Array',      arg: BEET_TYPE_ARG_LEN },
  Buffer     : { beet: 'fixedSizeBuffer',     sourcePack: BEET_PACKAGE, ts: 'Buffer',     arg: BEET_TYPE_ARG_LEN },
  Uint8Array : { beet: 'fixedSizeUint8Array', sourcePack: BEET_PACKAGE, ts: 'Uint8Array', arg: BEET_TYPE_ARG_LEN }
}
