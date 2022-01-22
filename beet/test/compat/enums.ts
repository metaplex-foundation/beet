import test from 'tape'
import { fixedScalarEnum } from '../../src/beet'
import { checkFixedSerialization } from '../utils'
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

function variantFromString<T>(enumType: T, variant: string): T {
  const idx = Object.values(enumType).indexOf(variant)
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
