import BN from 'bn.js'

const DEFAULT_BYTES = 1024

export type Borsh<T> = {
  write(buf: Buffer, offset: number, value: T): void
  read(buf: Buffer, offset: number): T
  byteSize: number
}

export type BorshField<T> = [keyof T, Borsh<T[keyof T]>]

export const u8: Borsh<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeUInt8(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readUInt8(offset)
  },
  byteSize: 1,
}

export const u16: Borsh<number> = {
  write: function (buf: Buffer, offset: number, value: number) {
    buf.writeUInt16LE(value, offset)
  },
  read: function (buf: Buffer, offset: number): number {
    return buf.readUInt16LE(offset)
  },
  byteSize: 2,
}

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
