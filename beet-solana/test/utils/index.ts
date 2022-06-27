import * as util from 'util'

export function inspect(obj: any, colors = true) {
  console.log(util.inspect(obj, { colors, depth: 5 }))
}

export function dbg(obj: any) {
  inspect(obj)
  return obj
}
