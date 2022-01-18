import test from 'tape'
import { u8 } from '../../src/beet'
import {
  dynamicSizeArray,
  dynamicSizeUtf8String,
  toFixed,
} from '../../src/beet.dynamic'
import { checkFixedSerialization } from '../utils'
import fixture from './fixtures/vecs.json'

test('compat vecs: u8s', (t) => {
  const beet = dynamicSizeArray(u8)
  for (const { value, data } of fixture.u8s) {
    const fixedBeet = beet.toFixed(value.length)
    checkFixedSerialization(
      t,
      fixedBeet,
      value,
      data,
      `[ ${value.join(', ')} ]`
    )
  }
  t.end()
})

// TODO(thlorenz): This fails since our current `toFixed` implementation assumes
// uniformly sized array elements.
// In this case each string has a different size/length and thus breaks that assumption
test.skip('compat vecs: strings', (t) => {
  for (const { value, data } of fixture.strings) {
    const lens =
      value.length > 0
        ? [value.length, ...value.map((x) => x.length)]
        : [value.length, 0]
    const beet = dynamicSizeArray(dynamicSizeUtf8String)
    const fixedBeet = toFixed(beet, lens)
    checkFixedSerialization(
      t,
      fixedBeet,
      value,
      data,
      `[ ${value.join(', ')} ]`
    )
  }
  t.end()
})
