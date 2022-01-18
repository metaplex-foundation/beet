import { strict as assert } from 'assert'
import { u8 } from './numbers'
import {
  assertFixedSizeBeet,
  Beet,
  BEET_TYPE_ARG_INNER,
  FixableBeet,
  FixedSizeBeet,
  isFixableBeet,
  isFixedSizeBeet,
  SupportedTypeDefinition,
} from '../types'
import { BEET_PACKAGE } from '../types'
import { logTrace } from '../utils'

/**
 * Represents the Rust Option type {@link T}.
 *
 * @template T inner option type
 *
 * @category beet/composite
 */
export type COption<T> = T | null

const NONE = 0
const SOME = 1

/**
 * De/Serializes an _Option_ of type {@link T} represented by {@link COption}.
 *
 * The de/serialized type is prefixed with `1` if the inner value is
 * present and with `0` if not.
 * This matches the `COption` type borsh representation.
 *
 * @template T inner option type
 * @param inner the De/Serializer for the inner type
 *
 * @category beet/composite
 */
export function fixedSizeOption<T>(inner: Beet<T>): FixedSizeBeet<COption<T>> {
  return {
    write: function (buf: Buffer, offset: number, value: COption<T>) {
      assertFixedSizeBeet(
        inner,
        `coption inner type ${inner.description} needs to be fixed before calling write`
      )
      if (value == null) {
        buf[offset] = NONE
        // NOTE: here we leave the remaining part of the buffer unchanged
        // as it won't be consumed on read either.
        // Also it should be zero filled already.
      } else {
        buf[offset] = SOME
        inner.write(buf, offset + 1, value)
      }
    },

    read: function (buf: Buffer, offset: number): COption<T> {
      assertFixedSizeBeet(
        inner,
        `coption inner type ${inner.description} needs to be fixed before calling read`
      )
      if (isNoneBuffer(buf, offset)) {
        return null
      }
      assert(isSomeBuffer(buf, offset), 'should be valid COption buffer')
      return inner.read(buf, offset + 1)
    },

    get byteSize() {
      assertFixedSizeBeet(
        inner,
        `coption inner type ${inner.description} needs to be fixed before getting byte size`
      )
      return 1 + inner.byteSize
    },
    description: `COption<${inner.description}>`,

    // @ts-ignore
    withFixedSizeInner(fixedInner: FixedSizeBeet<T>) {
      return fixedSizeOption(fixedInner)
    },

    get inner() {
      return inner
    },
  }
}

export function isSomeBuffer(buf: Buffer, offset: number) {
  return buf[offset] === SOME
}

export function isNoneBuffer(buf: Buffer, offset: number) {
  return buf[offset] === NONE
}

/**
 * De/Serializes `None` case of an _Option_ of type {@link T} represented by
 * {@link COption}.
 *
 * The de/serialized type is prefixed with `0`.
 * This matches the `COption::None` type borsh representation.
 *
 * @template T inner option type
 * @param inner the De/Serializer for the inner type
 *
 * @category beet/composite
 */
export function coptionNone<T>(inner: Beet<T>): FixedSizeBeet<COption<T>> {
  logTrace(`coptionNone(${inner.description})`)
  return {
    write: function (buf: Buffer, offset: number, value: COption<T>) {
      assert(value == null, 'coptionNone can only handle `null` values')
      buf[offset] = NONE
    },

    read: function (buf: Buffer, offset: number): COption<T> {
      assert(
        isNoneBuffer(buf, offset),
        'coptionNone can only handle `NONE` data'
      )
      return null
    },

    byteSize: 1,
    description: `COption<None(${inner.description})>`,

    // @ts-ignore
    withFixedSizeInner(fixedInner: FixedSizeBeet<T>) {
      return fixedSizeOption(fixedInner)
    },

    get inner() {
      return inner
    },
  }
}

/**
 * De/Serializes `Some` case of an _Option_ of type {@link T} represented by
 * {@link COption}.
 *
 * The de/serialized type is prefixed with `1`.
 * This matches the `COption::Some` type borsh representation.
 *
 * @template T inner option type
 * @param inner the De/Serializer for the inner type
 *
 * @category beet/composite
 */
export function coptionSome<T>(
  inner: FixedSizeBeet<T>
): FixedSizeBeet<COption<T>> {
  const byteSize = 1 + inner.byteSize

  const beet = {
    write: function (buf: Buffer, offset: number, value: COption<T>) {
      assertFixedSizeBeet(
        inner,
        `coption inner type ${inner.description} needs to be fixed before calling write`
      )
      assert(value != null, 'coptionSome cannot handle `null` values')
      buf[offset] = SOME
      inner.write(buf, offset + 1, value)
    },

    read: function (buf: Buffer, offset: number): COption<T> {
      assertFixedSizeBeet(
        inner,
        `coption inner type ${inner.description} needs to be fixed before calling read`
      )
      assert(
        isSomeBuffer(buf, offset),
        'coptionSome can only handle `SOME` data'
      )
      return inner.read(buf, offset + 1)
    },

    description: `COption<${inner.description}>[1 + ${inner.byteSize}]`,

    // @ts-ignore
    withFixedSizeInner(fixedInner: FixedSizeBeet<T>) {
      return fixedSizeOption(fixedInner)
    },

    byteSize,
    get inner() {
      return inner
    },
  }
  logTrace(beet.description)
  return beet
}

/**
 * De/Serializes an _Option_ of type {@link T} represented by {@link COption}.
 *
 * The de/serialized type is prefixed with `1` if the inner value is present
 * and with `0` if not.
 * This matches the `COption` type borsh representation.
 *
 * @template T inner option type
 * @param inner the De/Serializer for the inner type
 *
 * @category beet/composite
 */
export function coption<T, V = Partial<T>>(
  inner: Beet<T, V>
): FixableBeet<COption<T>> {
  return {
    toFixedFromData(buf: Buffer, offset: number): FixedSizeBeet<COption<T>, V> {
      // TODO(thlorenz): all beets should just have this
      // const [ innerFixed, innerByteSize ] = inner.toFixedFromData(buf, offset + byteSize)
      if (isSomeBuffer(buf, offset)) {
        const innerFixed = isFixedSizeBeet(inner)
          ? inner
          : isFixableBeet(inner)
          ? inner.toFixedFromData(buf, offset + 1)
          : (inner as FixedSizeBeet<T, V>)
        return coptionSome(innerFixed)
      } else {
        assert(isNoneBuffer(buf, offset), `Expected ${buf} to hold a COption`)
        const innerFixed = inner as FixedSizeBeet<T, V>
        return coptionNone(innerFixed)
      }
    },

    // TODO(thlorenz): Fix type issue
    // @ts-ignore
    toFixedFromValue(val: V): FixedSizeBeet<COption<T>, V> {
      const innerFixed = inner as FixedSizeBeet<T>
      return val == null ? coptionNone(innerFixed) : coptionSome(innerFixed)
    },

    description: `COption<${inner.description}`,
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
  inner: FixedSizeBeet<Data>
): FixedSizeBeet<DataEnum<Kind, Data>> {
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
