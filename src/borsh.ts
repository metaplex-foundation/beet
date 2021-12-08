import BN from 'bn.js'

const DEFAULT_BYTES = 1024

export type bignum = number | BN
export type Borsh<T> = {
  write(buf: Buffer, offset: number, value: T): void
  read(buf: Buffer, offset: number): T
  byteSize: number
  description: string
}

export type BorshField<T> = [keyof T, Borsh<T[keyof T]>]

// -----------------
// Numbers
// -----------------
export const u8: Borsh<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeUInt8(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readUInt8(offset)
  },
  byteSize: 1,
  description: 'primitive: u8',
}

export const u16: Borsh<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeUInt16LE(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readUInt16LE(offset)
  },
  byteSize: 2,
  description: 'primitive: u16',
}

export const u32: Borsh<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeUInt32LE(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readUInt32LE(offset)
  },
  byteSize: 4,
  description: 'primitive: u32',
}

function unsignedLargeBorsh(byteSize: number, description: string) {
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

export const u64: Borsh<bignum> = unsignedLargeBorsh(8, 'primitive: u64')
export const u128: Borsh<bignum> = unsignedLargeBorsh(16, 'primitive: u128')
export const u256: Borsh<bignum> = unsignedLargeBorsh(32, 'primitive: u256')
export const u512: Borsh<bignum> = unsignedLargeBorsh(64, 'primitive: u512')

// -----------------
// Writer
// -----------------
export class BorshWriter {
  private buf: Buffer
  private _offset: number
  constructor(private readonly allocateBytes = DEFAULT_BYTES) {
    this.buf = Buffer.alloc(allocateBytes)
    this._offset = 0
  }

  get buffer() {
    return this.buf
  }

  get offset() {
    return this._offset
  }

  private maybeResize(bytesNeeded: number) {
    if (this._offset + bytesNeeded > this.buf.length) {
      this.buf = Buffer.concat([this.buf, Buffer.alloc(this.allocateBytes)])
    }
  }

  write<T>(borsh: Borsh<T>, value: T) {
    this.maybeResize(borsh.byteSize)
    borsh.write(this.buf, this._offset, value)
    this._offset += borsh.byteSize
  }

  writeStruct<T>(instance: T, fields: BorshField<T>[]) {
    for (const [key, borsh] of fields) {
      const value = instance[key]
      this.write(borsh, value)
    }
  }
}

// -----------------
// Reader
// -----------------
export class BorshReader {
  constructor(private readonly buffer: Buffer, private _offset: number = 0) {}

  get offset() {
    return this._offset
  }

  read<T>(borsh: Borsh<T>): T {
    const value = borsh.read(this.buffer, this._offset)
    this._offset += borsh.byteSize
    return value
  }

  readStruct<T>(fields: BorshField<T>[]) {
    const acc: Partial<T> = {}
    for (const [key, borsh] of fields) {
      acc[key] = this.read(borsh)
    }
    return acc
  }
}

export class BorshStruct<T> implements Borsh<T> {
  readonly byteSize: number
  constructor(
    private readonly fields: BorshField<T>[],
    private readonly construct: (args: Partial<T>) => T,
    readonly description = BorshStruct.description
  ) {
    this.byteSize = this.getByteSize()
  }

  // TODO: support nested structs by implementing these methods
  read(_buf: Buffer, _offset: number): T {
    throw new Error('Method not implemented.')
  }

  write(_buf: Buffer, _offset: number, _value: T): void {
    throw new Error('Method not implemented.')
  }

  deserialize(buffer: Buffer, offset: number = 0): [T, number] {
    const reader = new BorshReader(buffer, offset)
    const args = reader.readStruct(this.fields)
    return [this.construct(args), reader.offset]
  }

  serialize(instance: T): Buffer {
    const writer = new BorshWriter()
    writer.writeStruct(instance, this.fields)
    return writer.buffer
  }

  private getByteSize() {
    return this.fields.reduce((acc, [_, borsh]) => acc + borsh.byteSize, 0)
  }

  static description = 'BorshStruct'
}
