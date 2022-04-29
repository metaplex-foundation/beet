import test from 'tape'
import { array, u8, uint8Array, utf8String } from '../../src/beet'
import { checkFixedSerialization } from '../utils'
import fixture from './fixtures/vecs.json'

test('compat vecs: u8s', (t) => {
  for (const { value, data } of fixture.u8s.slice(0, 3)) {
    // -----------------
    // Interpreting as Array[number]
    // -----------------

    {
      const beet = array(u8)
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

    // -----------------
    // Interpreting as Uint8Array
    // -----------------
    {
      const beet = uint8Array
      const uint8Value = Uint8Array.from(value)
      const fixedFromValue = beet.toFixedFromValue(uint8Value)
      checkFixedSerialization(
        t,
        fixedFromValue,
        uint8Value,
        data,
        `fixedFromValue: [ ${value.join(', ')} ]`
      )

      const fixedFromData = beet.toFixedFromData(
        Buffer.concat([
          Buffer.from([value.length, 0, 0, 0]),
          Buffer.from(data),
        ]),
        0
      )
      checkFixedSerialization(
        t,
        fixedFromData,
        uint8Value,
        data,
        `fixedFromData: [ ${value.join(', ')} ]`
      )
    }
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
