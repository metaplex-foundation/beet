import debug from 'debug'
import colors from 'ansicolors'
import { FixedSizeBeet, isElementCollectionFixedSizeBeet } from './types'
const { brightBlack } = colors

export const logError = debug('beet:error')
export const logInfo = debug('beet:info')
export const logDebug = debug('beet:debug')
export const logTrace = debug('beet:trace')

export function beetBytes<T, V = Partial<T>>(
  beet: FixedSizeBeet<T, V>,
  isDynamic = false
) {
  let bytes: string
  if (isElementCollectionFixedSizeBeet(beet)) {
    const len = isDynamic ? 'length' : beet.length
    const lenBytes = beet.lenPrefixByteSize
    bytes =
      lenBytes > 0
        ? `${lenBytes} + (${beet.elementByteSize} * ${len}) B  (${beet.byteSize} B)`
        : `(${beet.elementByteSize} * ${len}) B (${beet.byteSize} B)`
  } else {
    bytes = `${beet.byteSize} B`
  }
  return brightBlack(bytes)
}

export function bytes(n: number) {
  return brightBlack(`${n} B`)
}

/**
 * Use this to provide a map for structs which need no lengths
 */
export const EMPTY_MAP = new Map()
