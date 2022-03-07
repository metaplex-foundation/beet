import { strict as assert } from 'assert'
import {
  assertFixedSizeBeet,
  Beet,
  BEET_TYPE_ARG_INNER,
  FixableBeet,
  FixedSizeBeet,
  SupportedTypeDefinition,
} from '../types'
import { BEET_PACKAGE } from '../types'
import { logTrace } from '../utils'
import { fixBeetFromData, fixBeetFromValue } from '../beet.fixable'

/**
 * Represents the Rust Option type {@link T}.
 *
 * @template T inner option type
 *
 * @category beet/option
 */
export type COption<T> = T | null

const NONE = 0
const SOME = 1

/**
 * @private
 */
export function isSomeBuffer(buf: Buffer, offset: number) {
  return buf[offset] === SOME
}

/**
 * @private
 */
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
 * @category beet/option
 */
export function coptionNone<T>(description: string): FixedSizeBeet<COption<T>> {
  logTrace(`coptionNone(${description})`)
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
    description: `COption<None(${description})>`,
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
    byteSize,

    inner,
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
export function coption<T, V = T>(inner: Beet<T, V>): FixableBeet<COption<T>> {
  return {
    toFixedFromData(buf: Buffer, offset: number) {
      if (isSomeBuffer(buf, offset)) {
        const innerFixed = fixBeetFromData(inner, buf, offset + 1)
        return coptionSome(innerFixed)
      } else {
        assert(isNoneBuffer(buf, offset), `Expected ${buf} to hold a COption`)
        return coptionNone(inner.description)
      }
    },

    toFixedFromValue(val: V | Partial<COption<T>>) {
      return val == null
        ? coptionNone(inner.description)
        : coptionSome(fixBeetFromValue(inner, val as V))
    },

    description: `COption<${inner.description}>`,
  }
}

/**
 * @category TypeDefinition
 */
export type CompositesExports = keyof typeof import('./composites')
/**
 * @category TypeDefinition
 */
export type CompositesTypeMapKey = 'option'
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
export const compositesTypeMap: CompositesTypeMap = {
  option: {
    beet: 'coption',
    isFixable: true,
    sourcePack: BEET_PACKAGE,
    ts: 'COption<Inner>',
    arg: BEET_TYPE_ARG_INNER,
    pack: BEET_PACKAGE,
  },
}
