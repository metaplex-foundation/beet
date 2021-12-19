import BN from 'bn.js'

export type Beet<T> = {
  write(buf: Buffer, offset: number, value: T): void
  read(buf: Buffer, offset: number): T
  byteSize: number
  description: string
}

export type BeetField<T> = [keyof T, Beet<T[keyof T]>]

export type bignum = number | BN

export const BEET_TYPE_ARG_LEN = 'len'
export const BEET_TYPE_ARG_INNER = 'Beet<{innner}>'
/**
 * Defines a type supported by beet.
 *
 * @property beet is the Beet reader/writer to use for serialization
 *  - this could also be a function that produces it (when arg is set)
 * @property ts is the TypeScript type representing the deserialized type
 * @property arg specifies the type of arg to provide to create the Beet type
 *   - len: for fixed size arrays and strings
 *   - beet.Beet<T>: an inner Beet type 'T' for composite types like Option<Inner>
 *@property pack specifies which package is exporting the `ts` type if it is
 not built in
 */
export type SupportedTypeDefinition = {
  beet: string
  ts: string
  arg?: typeof BEET_TYPE_ARG_LEN | typeof BEET_TYPE_ARG_INNER
  pack?: string
}
