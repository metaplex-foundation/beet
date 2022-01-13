import {
  assertFixedSizeBeet,
  Beet,
  DynamicSizeCompositeBeet,
  FixedSizeBeet,
  FixedSizeCompositeBeet,
  isCompositeBeet,
  isDynamicSizeBeet,
  isDynamicSizeCompositeBeet,
} from './types'
import { fixedSizeArray } from './beets/collections'
import { strict as assert } from 'assert'

/**
 * Resolves all contained dymanic size beets to a static version using the
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
    const withFixedInner = beet.withFixedSizeInner(inner)

    if (isDynamicSizeCompositeBeet(withFixedInner)) {
      // @ts-ignore
      return withFixedInner.toFixed(lens.pop())
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

export function dynamicSizeArray<T>(
  element: Beet<T>
): DynamicSizeCompositeBeet<T[], T> {
  return {
    // @ts-ignore
    withFixedSizeInner(
      fixedInner: FixedSizeBeet<T>
    ): DynamicSizeCompositeBeet<T[], T> {
      return dynamicSizeArray(fixedInner)
    },

    // @ts-ignore
    get inner() {
      return element
    },

    // @ts-ignore
    toFixed(len: number): FixedSizeCompositeBeet<T[], T> {
      // @ts-ignore
      return fixedSizeArray(element, len, true)
    },
    description: `DynamicArray<${element.description}>`,
  }
}
