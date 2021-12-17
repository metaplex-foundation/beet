import { SupportedTypeDefinition } from '@metaplex-foundation/beet'
import { KeysExports, keysTypeMap, KeysTypeMapKey } from './keys'

export * from './keys'

export type BeetSolanaTypeMapKey = KeysTypeMapKey

export const supportedTypeMap: Record<
  BeetSolanaTypeMapKey,
  SupportedTypeDefinition & {
    beet: KeysExports
  }
> = keysTypeMap
