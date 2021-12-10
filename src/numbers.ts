import BN from 'bn.js'
import { bignum, Beet } from './types'

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
  description: 'primitive: u8',
}

export const u16: Beet<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeUInt16LE(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readUInt16LE(offset)
  },
  byteSize: 2,
  description: 'primitive: u16',
}

export const u32: Beet<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeUInt32LE(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readUInt32LE(offset)
  },
  byteSize: 4,
  description: 'primitive: u32',
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

export const u64: Beet<bignum> = unsignedLargeBeet(8, 'primitive: u64')
export const u128: Beet<bignum> = unsignedLargeBeet(16, 'primitive: u128')
export const u256: Beet<bignum> = unsignedLargeBeet(32, 'primitive: u256')
export const u512: Beet<bignum> = unsignedLargeBeet(64, 'primitive: u512')

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
  description: 'primitive: i8',
}

export const i16: Beet<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeInt16LE(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readInt16LE(offset)
  },
  byteSize: 2,
  description: 'primitive: i16',
}

export const i32: Beet<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeInt32LE(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readInt32LE(offset)
  },
  byteSize: 4,
  description: 'primitive: i32',
}
