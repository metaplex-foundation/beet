import debug from 'debug'
import colors from 'ansicolors'
const { brightBlack } = colors

export const logError = debug('beet:error')
export const logInfo = debug('beet:info')
export const logDebug = debug('beet:debug')
export const logTrace = debug('beet:trace')

export function bytes(val: { byteSize: number }) {
  return brightBlack(`${val.byteSize} B`)
}
