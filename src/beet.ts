import { Beet, BeetField } from './types'

export * from './collections'
export * from './composites'
export * from './numbers'
export * from './types'

const DEFAULT_BYTES = 1024

// -----------------
// Writer
// -----------------
export class BeetWriter {
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

  write<T>(beet: Beet<T>, value: T) {
    this.maybeResize(beet.byteSize)
    beet.write(this.buf, this._offset, value)
    this._offset += beet.byteSize
  }

  writeStruct<T>(instance: T, fields: BeetField<T>[]) {
    for (const [key, beet] of fields) {
      const value = instance[key]
      this.write(beet, value)
    }
  }
}

// -----------------
// Reader
// -----------------
export class BeetReader {
  constructor(private readonly buffer: Buffer, private _offset: number = 0) {}

  get offset() {
    return this._offset
  }

  read<T>(beet: Beet<T>): T {
    const value = beet.read(this.buffer, this._offset)
    this._offset += beet.byteSize
    return value
  }

  readStruct<T>(fields: BeetField<T>[]) {
    const acc: Partial<T> = {}
    for (const [key, beet] of fields) {
      acc[key] = this.read(beet)
    }
    return acc
  }
}

export class BeetStruct<Class, Args = Class> implements Beet<Class> {
  readonly byteSize: number
  constructor(
    private readonly fields: BeetField<Args>[],
    private readonly construct: (args: Partial<Args>) => Class,
    readonly description = BeetStruct.description
  ) {
    this.byteSize = this.getByteSize()
  }

  // TODO: support nested structs by implementing these methods
  read(_buf: Buffer, _offset: number): Class {
    throw new Error('Method not implemented.')
  }

  write(_buf: Buffer, _offset: number, _value: Class): void {
    throw new Error('Method not implemented.')
  }

  deserialize(buffer: Buffer, offset: number = 0): [Class, number] {
    const reader = new BeetReader(buffer, offset)
    const args = reader.readStruct(this.fields)
    return [this.construct(args), reader.offset]
  }

  serialize(instance: Args): Buffer {
    const writer = new BeetWriter()
    writer.writeStruct(instance, this.fields)
    return writer.buffer.slice(0, this.byteSize)
  }

  private getByteSize() {
    return this.fields.reduce((acc, [_, beet]) => acc + beet.byteSize, 0)
  }

  static description = 'BeetStruct'
}
