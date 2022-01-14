import {
  assertFixedSizeBeet,
  Beet,
  Collection,
  DynamicSizeBeet,
  FixedSizeBeet,
  isCompositeBeet,
  isDynamicSizeBeet,
  isDynamicSizeBeetStruct,
  isFixedSizeBeet,
} from './types'
import { fixedSizeArray, fixedSizeUtf8String } from './beets/collections'
import { strict as assert } from 'assert'

/**
 * Resolves all contained dynamic size beets or structs to a static version
 * using the provided lengths.
 *
 */
export function toFixed<T, V = T>(
  beet: Beet<T, V>,
  beetLengths: number[],
  structMaps: Map<string, number[]>[] = []
): FixedSizeBeet<T, V> {
  if (isDynamicSizeBeetStruct(beet)) {
    const map = structMaps.pop()
    assert(
      map != null,
      `Missing struct entry for ${beet.description}, inside ${structMaps}`
    )
    // TODO(thlorenz): How can we verify this is really Map<keyof V, number[]>?
    // (most likely via beet.fields)
    return beet.toFixedFromMap(map as Map<keyof V, number[]>)
  }

  if (isCompositeBeet(beet)) {
    // Handle inner beets first, i.e. make them fixed inside out
    const inner = toFixed(beet.inner, beetLengths, structMaps)
    const withFixedInner = beet.withFixedSizeInner(inner) as Beet<T, V>

    if (isDynamicSizeBeet(withFixedInner)) {
      const len = beetLengths.pop()
      assert(
        len != null,
        `Should provide enough 'lengths', ran out for ${beet.description}`
      )
      return withFixedInner.toFixed(len)
    }

    assertFixedSizeBeet(withFixedInner)

    return withFixedInner
  }
  // Non Composites
  if (isDynamicSizeBeet(beet)) {
    const len = beetLengths.pop()
    assert(
      len != null,
      `Should provide enough 'lengths', ran out for ${beet.description}`
    )
    return beet.toFixed(len)
  }
  assertFixedSizeBeet(beet)

  return beet
}

export function isFixedRecursively<T, V = T>(
  beet: Beet<T, V>
): beet is FixedSizeBeet<T, V> {
  if (isCompositeBeet(beet)) {
    return isFixedRecursively(beet.inner) && isFixedSizeBeet(beet)
  }
  return isFixedSizeBeet(beet)
}

/**
 * De/Serializes an array with a dynamic number of elements of type {@link T}.
 *
 * @template T type of elements held in the array
 *
 * @param element the De/Serializer for the element type
 *
 * @category beet/collection
 */
export function dynamicSizeArray<T, V = Partial<T>>(
  element: Beet<T, V>
): Collection<T[], V[]> & DynamicSizeBeet<T[], V[]> {
  return {
    get inner() {
      return element
    },

    withFixedSizeInner(fixedInner: FixedSizeBeet<T>) {
      return dynamicSizeArray(fixedInner)
    },

    toFixed(len: number): FixedSizeBeet<T[], V[]> {
      assertFixedSizeBeet(
        element,
        `Need to replace element ${element.description} of ${this.description} with fixed size version before calling 'toFixed'`
      )
      return fixedSizeArray(element, len, true)
    },

    description: `DynamicArray<${element.description}>`,
  }
}

/**
 * De/Serializes a UTF8 string of dynamic size.
 *
 * @category beet/collection
 */
export const dynamicSizeUtf8String: DynamicSizeBeet<string, string> = {
  toFixed(len: number): FixedSizeBeet<string> {
    return fixedSizeUtf8String(len)
  },
  description: 'Utf8String',
}
