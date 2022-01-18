import { PublicKey } from '@solana/web3.js'
import {
  FixedSizeBeet,
  fixedSizeUint8Array,
  SupportedTypeDefinition,
} from '@metaplex-foundation/beet'
const BEET_SOLANA_PACKAGE = '@metaplex-foundation/beet-solana'
const SOLANA_WEB3_PACKAGE = '@solana/web3.js'

const uint8Array32 = fixedSizeUint8Array(32)

/**
 * De/Serializer for solana {@link PublicKey}s aka `publicKey`.
 *
 *
 * ## Using PublicKey Directly
 *
 * ```ts
 * import { publicKey } from '@metaplex-foundation/beet-solana'
 *
 * const generatedKey  = Keypair.generate().publicKey
 * const buf = Buffer.alloc(publicKey.byteSize)
 * beet.write(buf, 0, generatedKey)
 * beet.read(buf, 0) // same as generatedKey
 * ```
 *
 * ## PublicKey as part of a Struct Configuration
 *
 * ```ts
 * import { publicKey } from '@metaplex-foundation/beet-solana'
 *
 * type InstructionArgs = {
 *   authority: web3.PublicKey
 * }
 *
 * const createStruct = new beet.BeetArgsStruct<InstructionArgs>(
 *   [
 *     ['authority', publicKey]
 *   ],
 *   'InstructionArgs'
 * )
 * ```
 *
 * @category beet/solana
 */
export const publicKey: FixedSizeBeet<PublicKey> = {
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

/**
 * @category TypeDefinition
 */
export type KeysExports = keyof typeof import('./keys')
/**
 * @category TypeDefinition
 */
export type KeysTypeMapKey = 'publicKey'
/**
 * @category TypeDefinition
 */
export type KeysTypeMap = Record<
  KeysTypeMapKey,
  SupportedTypeDefinition & { beet: KeysExports }
>

/**
 * Maps solana keys beet exports to metadata which describes in which package it
 * is defined as well as which TypeScript type is used to represent the
 * deserialized value in JavaScript.
 *
 * @category TypeDefinition
 */
export const keysTypeMap: KeysTypeMap = {
  publicKey: {
    beet: 'publicKey',
    sourcePack: BEET_SOLANA_PACKAGE,
    ts: 'PublicKey',
    pack: SOLANA_WEB3_PACKAGE,
  },
}
