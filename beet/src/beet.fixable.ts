import { Beet, isFixableBeet, isFixedSizeBeet } from './types'

/**
 * Converts the provided beet into a {@link FixedBeet} unless it already is.
 * The sizes for {@link FixableBeet}s are determined from the provided data.
 *
 * @param beet to convert
 * @param buf containing serialized data that the fixed beet needs to process
 * @param offset at which the data for the beet starts
 *
 * @category beet
 */
export function fixBeetFromData<T, V = Partial<T>>(
  beet: Beet<T, V>,
  buf: Buffer,
  offset: number
) {
  if (isFixedSizeBeet(beet)) {
    return beet
  }
  if (isFixableBeet(beet)) {
    return beet.toFixedFromData(buf, offset)
  }
  throw new Error(`${beet.description} is neither fixed size nor fixable`)
}

/**
 * Converts the provided beet into a {@link FixedBeet} unless it already is.
 * The sizes for {@link FixableBeet}s are determined from the provided value.
 *
 * @param beet to convert
 * @param val value that the fixed beet needs to process
 *
 * @category beet
 */
export function fixBeetFromValue<T, V = Partial<T>>(beet: Beet<T, V>, val: V) {
  if (isFixedSizeBeet(beet)) {
    return beet
  }
  if (isFixableBeet(beet)) {
    return beet.toFixedFromValue(val)
  }
  throw new Error(`${beet.description} is neither fixed size nor fixable`)
}
