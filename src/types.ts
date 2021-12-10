import BN from 'bn.js'

export type Beet<T> = {
  write(buf: Buffer, offset: number, value: T): void
  read(buf: Buffer, offset: number): T
  byteSize: number
  description: string
}

export type BeetField<T> = [keyof T, Beet<T[keyof T]>]

export type bignum = number | BN
