import BN from 'bn.js'

export type Borsh<T> = {
  write(buf: Buffer, offset: number, value: T): void
  read(buf: Buffer, offset: number): T
  byteSize: number
  description: string
}

export type BorshField<T> = [keyof T, Borsh<T[keyof T]>]

export type bignum = number | BN
