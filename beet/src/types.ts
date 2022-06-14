import BN from 'bn.js'
import { strict as assert } from 'assert'

/**
 * Matches name in package.json
 *
 * @private
 */
export const BEET_PACKAGE = '@metaplex-foundation/beet'

/**
 * Base Beet type.
 * @category beet
 */
export type BeetBase = {
  /**
   * Describes the type of data that is de/serialized and serves for debugging
   * and diagnostics only.
   */
  description: string
}

/**
 * Specifies the read/write methods that a beet may implement.
 * @category beet
 */
export type BeetReadWrite<T, V = Partial<T>> = {
  /**
   * Writes the value of type {@link T} to the provided buffer.
   *
   * @param buf the buffer to write the serialized value to
   * @param offset at which to start writing into the buffer
   * @param value to write
   */
  write(buf: Buffer, offset: number, value: T | V): void
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

/**
 * Implemented by {@link ElementCollectionFixedSizeBeet}s to expose information
 * about collection elements and collection size.
 * @category beet
 */
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

/**
 * Scalar Beet
 * @category beet
 */
export type ScalarFixedSizeBeet<T, V = Partial<T>> = BeetBase &
  BeetReadWrite<T, V>

/**
 * Beet for Collections
 * @category beet
 */
export type ElementCollectionFixedSizeBeet<T, V = Partial<T>> = BeetBase &
  BeetReadWrite<T, V> &
  ElementCollectionBeet

/**
 * Template for De/Serializer which is of fixed size, meaning its Buffer size
 * when serialized doesn't change depending on the data it contains.
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
 * Template for De/Serializer which has a dynamic size, meaning its Buffer size
 * when serialized changes depending on the data it contains.
 *
 * It is _fixable_ in the sense that a {@link FixedSizeBeet} can be derived
 * from it by providing either the value or serialized data for the particular
 * instance.
 *
 * @template T is the data type which is being de/serialized
 * @template V is the value type passed to the write which includes all
 * properties needed to produce {@link T}, defaults to `Partial<T>`
 *
 * @category beet
 */
export type FixableBeet<T, V = Partial<T>> = BeetBase & {
  /**
   * Provides a fixed size version of `this` by walking the provided data in
   * order to discover the sizes of the root beet and all nested beets.
   *
   * @param buf the Buffer containing the data for which to adapt this beet to
   * fixed size
   * @param offset the offset at which the data starts
   *
   */
  toFixedFromData: (buf: Buffer, offset: number) => FixedSizeBeet<T, V>

  /**
   * Provides a fixed size version of `this` by walking the provided value in
   * order to discover the sizes of the root beet and all nested beets.
   *
   * @param val the instance for which to adapt this beet to fixed size
   */
  toFixedFromValue: (val: V) => FixedSizeBeet<T, V>
}

/**
 * @category beet
 */
export type Beet<T, V = Partial<T>> = FixedSizeBeet<T, V> | FixableBeet<T, V>

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
export type BeetField<T, V = Partial<T>> = [
  keyof T & string,
  FixedSizeBeet<T[keyof T], V> | FixableBeet<T[keyof T], V>
]

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
 * @property isFixable if `true` the size of structs of this type depends on
 * the value/data they hold and needs to be _fixed_ with a value or data
 * NOTE: that if this is `false`, the struct is considered _fixed_ size which
 * means it has the same size no matter what value it holds
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
  isFixable: boolean
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

/**
 * @private
 */
export function assertFixedSizeBeet<T, V = Partial<T>>(
  x: Beet<T, V>,
  msg = `${x} should have been a fixed beet`
): asserts x is FixedSizeBeet<T, V> {
  assert(isFixedSizeBeet(x), msg)
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
export function isElementCollectionFixedSizeBeet<T, V = Partial<T>>(
  x: FixedSizeBeet<T, V>
): x is ElementCollectionFixedSizeBeet<T, V> {
  const keys = Object.keys(x)
  return (
    keys.includes('length') &&
    keys.includes('elementByteSize') &&
    keys.includes('lenPrefixByteSize')
  )
}

// -----------------
// Enums
// -----------------

// TypeScript enum type support isn't that great since it really ends up being an Object hash
// when transpiled.
// Therefore we have to jump through some hoops to make all types check out
export type Enum<T> =
  | { [key: number | string]: string | number | T }
  | number
  | T

/**
 * Enum Variant Kinds
 */
export type DataEnumKind<T> = keyof T

/**
 * Turns a `Record<K, Beet<V>>` into a discriminated union `{ __kind: K, dataBeet: Beet<V> }`.
 */
export type DataEnumBeet<T, Kind extends DataEnumKind<T> = DataEnumKind<T>> = [
  Kind,
  FixableBeet<T[Kind], any> | FixedSizeBeet<T[Kind], any>
]
/**
 * Turns a `Record<K, V>` into a discriminated union `{ __kind: K, ...V }`.
 */
export type DataEnumKeyAsKind<T> = {
  [K in DataEnumKind<T>]: { __kind: K } & T[K]
}[keyof T]
