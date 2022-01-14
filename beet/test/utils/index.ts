import { inspect } from 'util'

export function deepLog(obj: any) {
  console.log(inspect(obj, { depth: 15, colors: true }))
}
