import BN from 'bn.js'

/**
 * Matches name in package.json
 *
 * @private
 */
export const BEET_PACKAGE = '@metaplex-foundation/beet'

/**
 * Template for De/Serializer.
 *
 * @template T is the data type which is being de/serialized
 * @template V is the value type passed to the write which includes all
 * properties needed to produce {@link T}, defaults to `Partial<T>`
 *
 * @category beet
 */
export type FixedBeet<T, V = Partial<T>> = {
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
  /**
   * Describes the type of data that is de/serialized and serves for debugging
   * and diagnostics only.
   */
  description: string
}

/**
 * Type that includes function that returns a {@link Beet} when the lens are
 * provided.
 *
 * @param lens amount of elements for each dynamic part of the Beet ordered
 * inside out
 */
export type DynamicSizeBeet<T, V = Partial<T>> = {
  toFixed: (lens: DynamicSizeLens) => FixedBeet<T, V>
}

export type Beet<T, V = Partial<T>> = FixedBeet<T, V> | DynamicSizeBeet<T, V>

export type FixedBeetCollection<T, V = Partial<T>> = FixedBeet<T[], V[]> & {
  element: FixedBeet<T, V>
}

export type DynamicSizeLens = number[] | number

/**
 * Specifies a field that is part of the type {@link T} along with its De/Serializer.
 *
 * @template T the type of which the field is a member
 *
 * @category beet
 */
export type FixedBeetField<T> = [keyof T, FixedBeet<T[keyof T]>]

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
export type BeetField<T> = FixedBeetField<T> | DynamicSizeBeetField<T>

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
export function isFixedBeet<T>(x: Beet<T> | DynamicSizeBeet<T>): x is Beet<T> {
  return typeof x !== 'function'
}

/**
 * @private
 */
export function isDynamicSizeBeet<T>(
  x: Beet<T> | DynamicSizeBeet<T>
): x is DynamicSizeBeet<T> {
  return typeof x === 'function'
}

/**
 * @private
 */
export function isFixedBeetField<T>(f: BeetField<T>) {
  const [, beet] = f
  return isFixedBeet(beet)
}

/**
 * @private
 */
export function isDynamicSizeBeetField<T>(
  f: BeetField<T> | DynamicSizeBeetField<T>
) {
  const [, beet] = f
  return isDynamicSizeBeet(beet)
}

/**
 * @private
 */
export function isBeetCollection(
  beet: Beet<any>
): beet is FixedBeetCollection<any> {
  return (beet as FixedBeetCollection<any>).element != null
}

/**
 * @private
 */
export function isBeetPrimitive(beet: Beet<any>) {
  return !isBeetCollection(beet)
}
