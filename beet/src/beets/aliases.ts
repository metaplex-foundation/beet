import { FixableBeet, SupportedTypeDefinition } from '../types'
import { collectionsTypeMap, uint8Array } from './collections'

/**
 * Alias for {@link uint8Array}.
 * @category TypeDefinition
 */
export const bytes: FixableBeet<Uint8Array, Uint8Array> = uint8Array

/**
 * @category TypeDefinition
 */
export type AliasesExports = keyof typeof import('./aliases')
/**
 * @category TypeDefinition
 */
export type AliasesTypeMapKey = 'Uint8Array'

/**
 * @category TypeDefinition
 */
export type AliasesTypeMap = Record<
  AliasesTypeMapKey,
  SupportedTypeDefinition & { beet: AliasesExports }
>

export const aliasesTypeMap: AliasesTypeMap = {
  // @ts-ignore
  bytes: collectionsTypeMap.Uint8Array,
}
