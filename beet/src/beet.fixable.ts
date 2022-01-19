import { Beet, isFixableBeet, isFixedSizeBeet } from './types'

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

export function fixBeetFromValue<T, V = Partial<T>>(beet: Beet<T, V>, val: V) {
  if (isFixedSizeBeet(beet)) {
    return beet
  }
  if (isFixableBeet(beet)) {
    return beet.toFixedFromValue(val)
  }
  throw new Error(`${beet.description} is neither fixed size nor fixable`)
}
