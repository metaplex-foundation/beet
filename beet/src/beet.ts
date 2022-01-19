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

export * from './beets/collections'
export * from './beets/string'
export * from './beets/composites'
export * from './beets/numbers'
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
  | NumbersTypeMapKey

/**
 * @category TypeDefinition
 */
export type BeetExports =
  | CollectionsExports
  | StringExports
  | CompositesExports
  | NumbersExports

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
  ...numbersTypeMap,
}
