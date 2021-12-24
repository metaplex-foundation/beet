import { PublicKey } from '@solana/web3.js'
import {
  Beet,
  fixedSizeUint8Array,
  SupportedTypeDefinition,
} from '@metaplex-foundation/beet'
import { name } from '../package.json'
const BEET_SOLANA_PACKAGE: string = name
const SOLANA_WEB3_PACKAGE = '@solana/web3.js'

const uint8Array32 = fixedSizeUint8Array(32)

export const publicKey: Beet<PublicKey> = {
  write: function (buf: Buffer, offset: number, value: PublicKey): void {
    const arr = value.toBytes()
    uint8Array32.write(buf, offset, arr)
  },
  read: function (buf: Buffer, offset: number): PublicKey {
    const bytes = uint8Array32.read(buf, offset)
    return new PublicKey(bytes)
  },

  byteSize: uint8Array32.byteSize,
  description: 'PublicKey',
}

export type KeysExports = keyof typeof import('./keys')
export type KeysTypeMapKey = 'publicKey'
export type KeysTypeMap = Record<
  KeysTypeMapKey,
  SupportedTypeDefinition & { beet: KeysExports }
>

export const keysTypeMap: KeysTypeMap = {
  publicKey: {
    beet: 'publicKey',
    sourcePack: BEET_SOLANA_PACKAGE,
    ts: 'PublicKey',
    pack: SOLANA_WEB3_PACKAGE,
  },
}
