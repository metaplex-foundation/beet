import BN from 'bn.js'
import { bignum, SupportedTypeDefinition, FixedSizeBeet } from '../types'
import { BEET_PACKAGE } from '../types'

// -----------------
// Unsigned
// -----------------

/**
 * De/Serializer for 8-bit unsigned integers aka `u8`.
 *
 * @category beet/primitive
 */
export const u8: FixedSizeBeet<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeUInt8(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readUInt8(offset)
  },
  byteSize: 1,
  description: 'u8',
}

/**
 * De/Serializer 16-bit unsigned integers aka `u16`.
 *
 * @category beet/primitive
 */
export const u16: FixedSizeBeet<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeUInt16LE(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readUInt16LE(offset)
  },
  byteSize: 2,
  description: 'u16',
}

/**
 * De/Serializer for 32-bit unsigned integers aka `u32`.
 *
 * @category beet/primitive
 */
export const u32: FixedSizeBeet<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeUInt32LE(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readUInt32LE(offset)
  },
  byteSize: 4,
  description: 'u32',
}

function unsignedLargeBeet(byteSize: number, description: string) {
  return {
    write: function (buf: Buffer, offset: number, value: bignum) {
      const bn = BN.isBN(value) ? value : new BN(value)
      const bytesArray = bn.toArray('le', this.byteSize)
      const bytesArrayBuf = Buffer.from(bytesArray)
      bytesArrayBuf.copy(buf, offset, 0, this.byteSize)
    },
    read: function (buf: Buffer, offset: number): bignum {
      const slice = buf.slice(offset, offset + this.byteSize)
      return new BN(slice, 'le')
    },
    byteSize,
    description,
  }
}

/**
 * De/Serializer for 64-bit unsigned integers aka `u64` which serializes to a JavaScript
 * _BigNum_ via {@link https://github.com/indutny/bn.js | BN}.
 *
 * @category beet/primitive
 */
export const u64: FixedSizeBeet<bignum> = unsignedLargeBeet(8, 'u64')
/**
 * De/Serializer for 128-bit unsigned integers aka `u128` which serializes to a JavaScript
 * _BigNum_ via {@link https://github.com/indutny/bn.js | BN}.
 *
 * @category beet/primitive
 */
export const u128: FixedSizeBeet<bignum> = unsignedLargeBeet(16, 'u128')
/**
 * De/Serializer for 256-bit unsigned integers aka `u256` which serializes to a JavaScript
 * _BigNum_ via {@link https://github.com/indutny/bn.js | BN}.
 *
 * @category beet/primitive
 */
export const u256: FixedSizeBeet<bignum> = unsignedLargeBeet(32, 'u256')
/**
 * De/Serializer for 512-bit unsigned integers aka `u512` which serializes to a JavaScript
 * _BigNum_ via {@link https://github.com/indutny/bn.js | BN}.
 *
 * @category beet/primitive
 */
export const u512: FixedSizeBeet<bignum> = unsignedLargeBeet(64, 'u512')

// -----------------
// Signed
// -----------------
/**
 * De/Serializer 8-bit signed integers aka `i8`.
 *
 * @category beet/primitive
 */
export const i8: FixedSizeBeet<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeInt8(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readInt8(offset)
  },
  byteSize: 1,
  description: 'i8',
}

/**
 * De/Serializer 16-bit signed integers aka `i16`.
 *
 * @category beet/primitive
 */
export const i16: FixedSizeBeet<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeInt16LE(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readInt16LE(offset)
  },
  byteSize: 2,
  description: 'i16',
}

/**
 * De/Serializer 32-bit signed integers aka `i32`.
 *
 * @category beet/primitive
 */
export const i32: FixedSizeBeet<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeInt32LE(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readInt32LE(offset)
  },
  byteSize: 4,
  description: 'i32',
}

function signedLargeBeet(byteSize: number, description: string) {
  const bitSize = byteSize * 8
  return {
    write: function (buf: Buffer, offset: number, value: bignum) {
      const bn = (BN.isBN(value) ? value : new BN(value)).toTwos(bitSize)
      const bytesArray = bn.toArray('le', this.byteSize)
      const bytesArrayBuf = Buffer.from(bytesArray)
      bytesArrayBuf.copy(buf, offset, 0, this.byteSize)
    },
    read: function (buf: Buffer, offset: number): bignum {
      const slice = buf.slice(offset, offset + this.byteSize)
      const x = new BN(slice, 'le')
      return x.fromTwos(bitSize)
    },
    byteSize,
    description,
  }
}

/**
 * De/Serializer for 64-bit signed integers aka `i64` which serializes to a JavaScript
 * _BigNum_ via {@link https://github.com/indutny/bn.js | BN}.
 *
 * @category beet/primitive
 */
export const i64: FixedSizeBeet<bignum> = signedLargeBeet(8, 'i64')
/**
 * De/Serializer for 128-bit signed integers aka `i128` which serializes to a JavaScript
 * _BigNum_ via {@link https://github.com/indutny/bn.js | BN}.
 *
 * @category beet/primitive
 */
export const i128: FixedSizeBeet<bignum> = signedLargeBeet(16, 'i128')
/**
 * De/Serializer for 256-bit signed integers aka `i256` which serializes to a JavaScript
 * _BigNum_ via {@link https://github.com/indutny/bn.js | BN}.
 *
 * @category beet/primitive
 */
export const i256: FixedSizeBeet<bignum> = signedLargeBeet(32, 'i256')
/**
 * De/Serializer for 512-bit signed integers aka `i512` which serializes to a JavaScript
 * _BigNum_ via {@link https://github.com/indutny/bn.js | BN}.
 *
 * @category beet/primitive
 */
export const i512: FixedSizeBeet<bignum> = signedLargeBeet(64, 'i512')

// -----------------
// Boolean
// -----------------
/**
 * De/Serializer booleans aka `bool`.
 *
 * @category beet/primitive
 */
export const bool: FixedSizeBeet<boolean> = {
  write: function (buf: Buffer, offset: number, value: boolean): void {
    const n = value ? 1 : 0
    u8.write(buf, offset, n)
  },
  read: function (buf: Buffer, offset: number): boolean {
    return u8.read(buf, offset) === 1
  },
  byteSize: 1,
  description: 'bool',
}

/**
 * @category TypeDefinition
 */
export type NumbersExports = keyof typeof import('./numbers')
/**
 * @category TypeDefinition
 */
export type NumbersTypeMapKey =
  | 'u8'
  | 'u16'
  | 'u32'
  | 'u64'
  | 'u128'
  | 'u256'
  | 'u512'
  | 'i8'
  | 'i16'
  | 'i32'
  | 'i64'
  | 'i128'
  | 'i256'
  | 'i512'
  | 'bool'
/**
 * @category TypeDefinition
 */
export type NumbersTypeMap = Record<
  NumbersTypeMapKey,
  SupportedTypeDefinition & { beet: NumbersExports }
>

/**
 * Maps primitive beet exports to metadata which describes in which package it
 * is defined as well as which TypeScript type is used to represent the
 * deserialized value in JavaScript.
 *
 * @category TypeDefinition
 */
// prettier-ignore
export const numbersTypeMap: NumbersTypeMap = {
  // <= 32-bit numbers and boolean
  u8   : { beet: 'u8',   isFixable: false, sourcePack: BEET_PACKAGE, ts: 'number'  },
  u16  : { beet: 'u16',  isFixable: false, sourcePack: BEET_PACKAGE, ts: 'number'  },
  u32  : { beet: 'u32',  isFixable: false, sourcePack: BEET_PACKAGE, ts: 'number'  },
  i8   : { beet: 'i8',   isFixable: false, sourcePack: BEET_PACKAGE, ts: 'number'  },
  i16  : { beet: 'i16',  isFixable: false, sourcePack: BEET_PACKAGE, ts: 'number'  },
  i32  : { beet: 'i32',  isFixable: false, sourcePack: BEET_PACKAGE, ts: 'number'  },
  bool : { beet: 'bool', isFixable: false, sourcePack: BEET_PACKAGE, ts: 'boolean' },
  // Big Number, they use, the 'bignum' type which is defined in this package
  u64  : { beet: 'u64',  isFixable: false, sourcePack: BEET_PACKAGE, ts: 'bignum', pack: BEET_PACKAGE  },
  u128 : { beet: 'u128', isFixable: false, sourcePack: BEET_PACKAGE, ts: 'bignum', pack: BEET_PACKAGE  },
  u256 : { beet: 'u256', isFixable: false, sourcePack: BEET_PACKAGE, ts: 'bignum', pack: BEET_PACKAGE  },
  u512 : { beet: 'u512', isFixable: false, sourcePack: BEET_PACKAGE, ts: 'bignum', pack: BEET_PACKAGE  },
  i64  : { beet: 'i64',  isFixable: false, sourcePack: BEET_PACKAGE, ts: 'bignum', pack: BEET_PACKAGE  },
  i128 : { beet: 'i128', isFixable: false, sourcePack: BEET_PACKAGE, ts: 'bignum', pack: BEET_PACKAGE  },
  i256 : { beet: 'i256', isFixable: false, sourcePack: BEET_PACKAGE, ts: 'bignum', pack: BEET_PACKAGE  },
  i512 : { beet: 'i512', isFixable: false, sourcePack: BEET_PACKAGE, ts: 'bignum', pack: BEET_PACKAGE  },
}
