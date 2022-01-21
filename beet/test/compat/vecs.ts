import test from 'tape'
import { array, u8, utf8String } from '../../src/beet'
import { checkFixedSerialization } from '../utils'
import fixture from './fixtures/vecs.json'

test('compat vecs: u8s', (t) => {
  const beet = array(u8)
  for (const { value, data } of fixture.u8s) {
    const fixedFromValue = beet.toFixedFromValue(value)
    checkFixedSerialization(
      t,
      fixedFromValue,
      value,
      data,
      `fixedFromValue: [ ${value.join(', ')} ]`
    )

    const fixedFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedSerialization(
      t,
      fixedFromData,
      value,
      data,
      `fixedFromData: [ ${value.join(', ')} ]`
    )
  }
  t.end()
})

test('compat vecs: strings', (t) => {
  for (const { value, data } of fixture.strings) {
    const beet = array(utf8String)
    const fixedFromValue = beet.toFixedFromValue(value)
    checkFixedSerialization(
      t,
      fixedFromValue,
      value,
      data,
      `fixedFromValue: [ ${value.join(', ')} ]`
    )

    const fixedFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedSerialization(
      t,
      fixedFromData,
      value,
      data,
      `fixedFromData: [ ${value.join(', ')} ]`
    )
  }
  t.end()
})
