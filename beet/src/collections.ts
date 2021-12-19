import { Beet, BEET_TYPE_ARG_LEN, SupportedTypeDefinition } from './types'
import { strict as assert } from 'assert'
import { u32 } from './numbers'
import { name } from '../package.json'
const BEET_PACKAGE: string = name

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
    description: `utf8-string(${stringByteLength})`,
  }
}

export function fixedSizeArray<T>(
  element: Beet<T>,
  len: number,
  lenPrefix: boolean = false
): Beet<T[]> {
  const arraySize = element.byteSize * len
  const byteSize = lenPrefix ? 4 + arraySize : arraySize

  return {
    write: function (buf: Buffer, offset: number, value: T[]): void {
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
    description: `Array<${element.description}>(${len})`,
  }
}

export function fixedSizeBuffer(bytes: number): Beet<Buffer> {
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

export function fixedSizeUint8Array(len: number): Beet<Uint8Array> {
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

export type CollectionsExports = keyof typeof import('./collections')
export type CollectionsTypeMapKey = 'string' | 'Array' | 'Buffer' | 'Uint8Array'
export type CollectionsTypeMap = Record<
  CollectionsTypeMapKey,
  SupportedTypeDefinition & { beet: CollectionsExports }
>

// prettier-ignore
export const collectionsTypeMap: CollectionsTypeMap = {
  string     : { beet: 'fixedSizeUtf8String', sourcePack: BEET_PACKAGE, ts: 'string',     arg: BEET_TYPE_ARG_LEN },
  Array      : { beet: 'fixedSizeArray',      sourcePack: BEET_PACKAGE, ts: 'Array',      arg: BEET_TYPE_ARG_LEN },
  Buffer     : { beet: 'fixedSizeBuffer',     sourcePack: BEET_PACKAGE, ts: 'Buffer',     arg: BEET_TYPE_ARG_LEN },
  Uint8Array : { beet: 'fixedSizeUint8Array', sourcePack: BEET_PACKAGE, ts: 'Uint8Array', arg: BEET_TYPE_ARG_LEN }
}
