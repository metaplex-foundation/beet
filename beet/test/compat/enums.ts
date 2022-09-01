import test from 'tape'
import { fixedScalarEnum } from '../../src/beet'
import {
  checkFixedDeserialize,
  checkFixedSerialization,
  checkFixedSerialize,
} from '../utils'
import fixture from './fixtures/enums.json'

enum Directions {
  Up,
  Right,
  Down,
  Left,
}

enum Milligrams {
  Grams,
  Kilograms,
}

function variantFromString<T>(enumType: T & {}, variant: string): T {
  const idx = Object.keys(enumType).indexOf(variant)
  return Object.values(enumType)[idx] as T
}

test('compat enums: directions', (t) => {
  const beet = fixedScalarEnum(Directions)
  for (const { value, data } of fixture.directions) {
    const direction = variantFromString(Directions, value)
    checkFixedSerialization(t, beet, direction, data)
  }
  t.end()
})

test('compat enums: milligrams', (t) => {
  const beet = fixedScalarEnum(Milligrams)
  for (const { value, data } of fixture.milligrams) {
    const milligram = variantFromString(Milligrams, value)
    checkFixedSerialization(t, beet, milligram, data)
  }
  t.end()
})

test('compat enums: directions using int', (t) => {
  const beet = fixedScalarEnum(Directions)
  const buf = Buffer.alloc(beet.byteSize)
  beet.write(buf, 0, Directions.Down)
  // Clearer test to show expected values
  checkFixedSerialize(
    t,
    beet,
    Directions.Down,
    [0x02],
    'Directions.Down Serialize'
  )
  checkFixedDeserialize(
    t,
    beet,
    Directions.Down,
    [0x02],
    'Directions.Down Deserialize'
  )
  t.end()
})
