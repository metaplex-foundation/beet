import BN from 'bn.js'
import { strict as assert } from 'assert'
import { DynamicSizeBeetStruct } from './struct.dynamic'

/**
 * Matches name in package.json
 *
 * @private
 */
export const BEET_PACKAGE = '@metaplex-foundation/beet'

export type BeetBase = {
  /**
   * Describes the type of data that is de/serialized and serves for debugging
   * and diagnostics only.
   */
  description: string
}

export type BeetReadWrite<T, V = Partial<T>> = {
  /**
   * Writes the value of type {@link T} to the provided buffer.
   *
   * @param buf the buffer to write the serialized value to
   * @param offset at which to start writing into the buffer
   * @param value to write
   */
  write(buf: Buffer, offset: number, value: V): void
  /**
   * Reads the data in the provided buffer and deserializes it into a value of
   * type {@link T}.
   *
   * @param buf containing the data to deserialize
   * @param offset at which to start reading from the buffer
   * @returns deserialized instance of type {@link T}.
   */
  read(buf: Buffer, offset: number): T

  /**
   * Number of bytes that are used to store the value in a {@link Buffer}
   */
  byteSize: number
}

export type ElementCollectionBeet = {
  /**
   * For arrays and strings this indicates the byte size of each element.
   */
  elementByteSize: number

  /**
   * For arrays and strings this indicates the amount of elements/chars.
   */
  length: number

  /**
   * For arrays and strings this indicates the byte size of the number that
   * indicates its length.
   *
   * Thus the size of each element for arrays is `(this.byteSize - lenPrefixSize) / elementCount`
   */
  lenPrefixByteSize: number
}

export type ScalarFixedSizeBeet<T, V = Partial<T>> = BeetBase &
  BeetReadWrite<T, V>

export type ElementCollectionFixedSizeBeet<T, V = Partial<T>> = BeetBase &
  BeetReadWrite<T, V> &
  ElementCollectionBeet

/**
 * Template for De/Serializer.
 *
 * @template T is the data type which is being de/serialized
 * @template V is the value type passed to the write which includes all
 * properties needed to produce {@link T}, defaults to `Partial<T>`
 *
 * @category beet
 */
export type FixedSizeBeet<T, V = Partial<T>> =
  | ScalarFixedSizeBeet<T, V>
  | ElementCollectionFixedSizeBeet<T, V>

/**
 * Type that includes function that returns a {@link FixedSizeBeet} when the lens are
 * provided.
 *
 * @param len amount of elements
 * */
export type DynamicSizeBeet<T, V = Partial<T>> = BeetBase & {
  toFixed: (len: number) => FixedSizeBeet<T, V>
}

export type FixableBeet<T, V = Partial<T>> = BeetBase & {
  toFixedFromData: (buf: Buffer, offset: number) => FixedSizeBeet<T, V>
  toFixedFromValue: (val: V) => FixedSizeBeet<T, V>
}

export type Beet<T, V = Partial<T>> =
  | FixedSizeBeet<T, V>
  | DynamicSizeBeet<T, V>
  | FixableBeet<T, V>

export type Composite<T, V, InnerT, InnerV = Partial<InnerT>> = Beet<T, V> & {
  inner: Beet<InnerT, InnerV>
  withFixedSizeInner(
    fixedInner: FixedSizeBeet<InnerT, InnerV>
  ): Composite<T, V, InnerT, InnerV>
}

export type Collection<
  T extends InnerT[],
  V extends InnerV[],
  InnerT = T[number],
  InnerV = V[number]
> = Beet<T, V> & Composite<T, V, InnerT, InnerV>

/**
 * Specifies a field that is part of the type {@link T} along with its De/Serializer.
 *
 * @template T the type of which the field is a member
 *
 * @category beet
 */
export type FixedBeetField<T> = [keyof T, FixedSizeBeet<T[keyof T]>]

/**
 * Specifies a field that is part of the type {@link T} along with its De/Serializer.
 *
 * @template T the type of which the field is a member
 *
 * @category beet
 */
export type DynamicSizeBeetField<T> = [keyof T, DynamicSizeBeet<T[keyof T]>]

/**
 * Specifies a field that is part of the type {@link T} along with its De/Serializer.
 *
 * @template T the type of which the field is a member
 *
 * @category beet
 */
export type BeetField<T, V = Partial<T>> = [
  keyof T & string,
  (
    | FixedSizeBeet<T[keyof T], V>
    | FixableBeet<T[keyof T], V>
    | DynamicSizeBeet<T[keyof T], V>
  )
]

// FixedBeetField<T> | DynamicSizeBeetField<T>

/**
 * Represents a number that can be larger than the builtin Integer type.
 * It is backed by {@link https://github.com/indutny/bn.js | BN} for large numbers.
 *
 * @category beet
 */
export type bignum = number | BN

/**
 * @private
 * @category beet
 */
export const BEET_TYPE_ARG_LEN = 'len'

/**
 * @private
 * @category beet
 */
export const BEET_TYPE_ARG_INNER = 'Beet<{innner}>'
/**
 * Defines a type supported by beet.
 *
 * @property beet is the Beet reader/writer to use for serialization
 *  - this could also be a function that produces it (when arg is set)
 * @property sourcPack the package where the definition is exported,
 * i.e. beet or beet-solana
 * @property ts is the TypeScript type representing the deserialized type
 * @property arg specifies the type of arg to provide to create the Beet type
 *   - len: for fixed size arrays and strings
 *   - beet.Beet<T>: an inner Beet type 'T' for composite types like Option<Inner>
 * @property pack specifies which package is exporting the `ts` type if it is
 * not built in
 *
 * @category TypeDefinition
 */
export type SupportedTypeDefinition = {
  beet: string
  sourcePack: string
  ts: string
  arg?: typeof BEET_TYPE_ARG_LEN | typeof BEET_TYPE_ARG_INNER
  pack?: string
}

// -----------------
// Guards
// -----------------
/**
 * @private
 */
export function isFixedSizeBeet<T, V = Partial<T>>(
  x: Beet<T, V>
): x is FixedSizeBeet<T> {
  return Object.keys(x).includes('byteSize')
}

export function assertFixedSizeBeet<T, V = Partial<T>>(
  x: Beet<T, V>,
  msg = `${x} should have been a fixed beet`
): asserts x is FixedSizeBeet<T, V> {
  assert(isFixedSizeBeet(x), msg)
}

/**
 * @private
 */
export function isDynamicSizeBeet<T, V>(
  x: Beet<T, V>
): x is DynamicSizeBeet<T, V> {
  return typeof (x as DynamicSizeBeet<T, V>).toFixed === 'function'
}

/**
 * @private
 */
export function isFixableBeet<T, V>(x: Beet<T, V>): x is FixableBeet<T, V> {
  return (
    typeof (x as FixableBeet<T, V>).toFixedFromData === 'function' &&
    typeof (x as FixableBeet<T, V>).toFixedFromValue === 'function'
  )
}

/**
 * @private
 */
export function isDynamicSizeBeetStruct<T, V>(
  x: Beet<T, V>
): x is DynamicSizeBeetStruct<T, V> {
  return typeof (x as DynamicSizeBeetStruct<T, V>).toFixedFromMap === 'function'
}

/**
 * @private
 */
export function isCompositeBeet<T, V = Partial<T>>(
  x: Beet<T, V> | Composite<T, V, any, any>
): x is Composite<T, V, any, any> {
  return (x as Composite<T, V, any, any>).inner != null
}

/**
 * @private
 */
export function isElementCollectionFixedSizeBeet<T, V = Partial<T>>(
  x: FixedSizeBeet<T, V>
): x is ElementCollectionFixedSizeBeet<T, V> {
  const keys = Object.keys(x)
  return (
    keys.includes('len') &&
    keys.includes('elementByteSize') &&
    keys.includes('lenPrefixByteSize')
  )
}
