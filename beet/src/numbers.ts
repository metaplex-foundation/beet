import BN from 'bn.js'
import { bignum, Beet, SupportedTypeDefinition } from './types'

// -----------------
// Unsigned
// -----------------
export const u8: Beet<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeUInt8(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readUInt8(offset)
  },
  byteSize: 1,
  description: 'u8',
}

export const u16: Beet<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeUInt16LE(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readUInt16LE(offset)
  },
  byteSize: 2,
  description: 'u16',
}

export const u32: Beet<number> = {
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

export const u64: Beet<bignum> = unsignedLargeBeet(8, 'u64')
export const u128: Beet<bignum> = unsignedLargeBeet(16, 'u128')
export const u256: Beet<bignum> = unsignedLargeBeet(32, 'u256')
export const u512: Beet<bignum> = unsignedLargeBeet(64, 'u512')

// -----------------
// Signed
// -----------------
export const i8: Beet<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeInt8(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readInt8(offset)
  },
  byteSize: 1,
  description: 'i8',
}

export const i16: Beet<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeInt16LE(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readInt16LE(offset)
  },
  byteSize: 2,
  description: 'i16',
}

export const i32: Beet<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeInt32LE(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readInt32LE(offset)
  },
  byteSize: 4,
  description: 'i32',
}

// -----------------
// Boolean
// -----------------
export const bool: Beet<boolean> = {
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

export type NumbersExports = keyof typeof import('./numbers')
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
  | 'bool'
export type NumbersTypeMap = Record<
  NumbersTypeMapKey,
  SupportedTypeDefinition & { beet: NumbersExports }
>

// prettier-ignore
export const numbersTypeMap: NumbersTypeMap = {
  u8   : { beet: 'u8',   ts: 'number'      },
  u16  : { beet: 'u16',  ts: 'number'      },
  u32  : { beet: 'u32',  ts: 'number'      },
  u64  : { beet: 'u64',  ts: 'beet.bignum' },
  u128 : { beet: 'u128', ts: 'beet.bignum' },
  u256 : { beet: 'u256', ts: 'beet.bignum' },
  u512 : { beet: 'u512', ts: 'beet.bignum' },
  i8   : { beet: 'i8',   ts: 'number'      },
  i16  : { beet: 'i16',  ts: 'number'      },
  i32  : { beet: 'i32',  ts: 'number'      },
  bool : { beet: 'bool', ts: 'boolean'      },
}
