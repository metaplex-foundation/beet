import { strict as assert } from 'assert'
import { u8 } from './numbers'
import { Beet, BEET_TYPE_ARG_INNER, SupportedTypeDefinition } from '../types'
import { BEET_PACKAGE } from '../types'

/**
 * Represents the Rust Option type {@link T}.
 *
 * @template T inner option type
 *
 * @category beet/composite
 */
export type COption<T> = T | null

const SOME = Buffer.from(Uint8Array.from([1, 0, 0, 0])).slice(0, 4)
const NONE = Buffer.from(Uint8Array.from([0, 0, 0, 0])).slice(0, 4)

/**
 * De/Serializes an _Option_ of type {@link T} represented by {@link COption}.
 *
 * The de/serialized type is prefixed with `[1, 0, 0, 0]` if the inner value is
 * present and with `[0, 0, 0, 0]` if not.
 * This matches the `COption` type borsh representation.
 *
 * @template T inner option type
 * @param inner the De/Serializer for the inner type
 *
 * @category beet/composite
 */
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

/**
 * Represents an {@link Enum} type which contains data.
 *
 * @template Kind the enum variant, i.e. `Color.Red`
 * @template Data the data value, i.e. '#f00'
 *
 * @category beet/composite
 */
export type DataEnum<Kind, Data> = { kind: Kind & number; data: Data }
/**
 * De/Serializes an {@link Enum} that contains a type of data, i.e. a {@link Struct}.
 * The main difference to a Rust enum is that the type of data has to be the
 * same for all enum variants.
 *
 * @template T inner enum data type
 *
 * @param inner the De/Serializer for the data type
 *
 * @category beet/composite
 */
export function dataEnum<Kind, Data>(
  inner: Beet<Data>
): Beet<DataEnum<Kind, Data>> {
  return {
    write: function (buf: Buffer, offset: number, value: DataEnum<Kind, Data>) {
      u8.write(buf, offset, value.kind)
      inner.write(buf, offset + 1, value.data)
    },

    read: function (buf: Buffer, offset: number): DataEnum<Kind, Data> {
      const kind = u8.read(buf, offset) as DataEnum<Kind, Data>['kind']
      const data = inner.read(buf, offset + 1)
      return { kind, data }
    },
    byteSize: 1 + inner.byteSize,
    description: `DataEnum<${inner.description}>`,
  }
}
/**
 * @category TypeDefinition
 */
export type CompositesExports = keyof typeof import('./composites')
/**
 * @category TypeDefinition
 */
export type CompositesTypeMapKey = 'option' | 'enum'
/**
 * @category TypeDefinition
 */
export type CompositesTypeMap = Record<
  CompositesTypeMapKey,
  SupportedTypeDefinition & { beet: CompositesExports }
>

/**
 * Maps composite beet exports to metadata which describes in which package it
 * is defined as well as which TypeScript type is used to represent the
 * deserialized value in JavaScript.
 *
 * @category TypeDefinition
 */
// prettier-ignore
export const compositesTypeMap: CompositesTypeMap = {
  option: { beet: 'coption', sourcePack: BEET_PACKAGE, ts: 'COption<Inner>',        arg: BEET_TYPE_ARG_INNER, pack: BEET_PACKAGE },
  enum:   { beet: 'dataEnum', sourcePack: BEET_PACKAGE, ts: 'DataEnum<Kind, Inner>', arg: BEET_TYPE_ARG_INNER, pack: BEET_PACKAGE}
}
