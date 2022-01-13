import {
  assertFixedSizeBeet,
  Beet,
  Collection,
  DynamicSizeBeet,
  FixedSizeBeet,
  isCompositeBeet,
  isDynamicSizeBeet,
} from './types'
import { fixedSizeArray, fixedSizeUtf8String } from './beets/collections'
import { strict as assert } from 'assert'

/**
 * Resolves all contained dynamic size beets to a static version using the
 * provided lens.
 *
 */
export function toFixed<T, V = T>(
  beet: Beet<T, V>,
  lens: number[]
): FixedSizeBeet<T, V> {
  if (isCompositeBeet(beet)) {
    // Handle inner beets first, i.e. make them fixed inside out
    const inner = toFixed(beet.inner, lens)
    const withFixedInner = beet.withFixedSizeInner(inner) as Beet<T, V>

    if (isDynamicSizeBeet(withFixedInner)) {
      const len = lens.pop()
      assert(
        len != null,
        `Should provide enough 'lens', ran out for ${beet.description}`
      )
      return withFixedInner.toFixed(len)
    }

    assertFixedSizeBeet(withFixedInner)

    return withFixedInner
  }
  // Non Composites
  if (isDynamicSizeBeet(beet)) {
    const len = lens.pop()
    assert(
      len != null,
      `Should provide enough 'lens', ran out for ${beet.description}`
    )
    return beet.toFixed(len)
  }
  assertFixedSizeBeet(beet)

  return beet
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
export function dynamicSizeUtf8String(): DynamicSizeBeet<string> {
  return {
    toFixed(len: number): FixedSizeBeet<string> {
      return fixedSizeUtf8String(len)
    },
    description: 'Utf8String',
  }
}
