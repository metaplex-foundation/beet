import { SupportedTypeDefinition } from './types'
import {
  CollectionsExports,
  collectionsTypeMap,
  CollectionsTypeMapKey,
} from './beets/collections'
import {
  CompositesExports,
  compositesTypeMap,
  CompositesTypeMapKey,
} from './beets/composites'
import {
  NumbersExports,
  numbersTypeMap,
  NumbersTypeMapKey,
} from './beets/numbers'
import { StringExports, stringTypeMap, StringTypeMapKey } from './beets/string'
import { EnumsExports, enumsTypeMap, EnumsTypeMapKey } from './beets/enums'
import {
  AliasesExports,
  aliasesTypeMap,
  AliasesTypeMapKey,
} from './beets/aliases'
import { TuplesExports, tuplesTypeMap, TuplesTypeMapKey } from './beets/tuples'
import { MapsExports, mapsTypeMap, MapsTypeMapKey } from './beets/maps'

export * from './beets/aliases'
export * from './beets/collections'
export * from './beets/composites'
export * from './beets/enums'
export * from './beets/maps'
export * from './beets/numbers'
export * from './beets/string'
export * from './beets/tuples'
export * from './beet.fixable'
export * from './read-write'
export * from './struct'
export * from './struct.fixable'
export * from './types'

/**
 * @category TypeDefinition
 */
export type BeetTypeMapKey =
  | CollectionsTypeMapKey
  | StringTypeMapKey
  | CompositesTypeMapKey
  | EnumsTypeMapKey
  | NumbersTypeMapKey
  | AliasesTypeMapKey
  | TuplesTypeMapKey
  | MapsTypeMapKey

/**
 * @category TypeDefinition
 */
export type BeetExports =
  | CollectionsExports
  | StringExports
  | CompositesExports
  | EnumsExports
  | NumbersExports
  | AliasesExports
  | TuplesExports
  | MapsExports

/**
 * Maps all {@link Beet} de/serializers to metadata which describes in which
 * package it is defined as well as which TypeScript type is used to represent
 * the deserialized value in JavaScript.
 *
 * @category TypeDefinition
 */
export const supportedTypeMap: Record<
  BeetTypeMapKey,
  SupportedTypeDefinition & {
    beet: BeetExports
  }
> = {
  ...collectionsTypeMap,
  ...stringTypeMap,
  ...compositesTypeMap,
  ...enumsTypeMap,
  ...numbersTypeMap,
  ...aliasesTypeMap,
  ...tuplesTypeMap,
  ...mapsTypeMap,
}
