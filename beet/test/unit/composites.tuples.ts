import {
  u8,
  fixedSizeUtf8String,
  fixedSizeTuple,
  i16,
  u32,
  tuple,
  utf8String,
} from '../../src/beet'

import test from 'tape'
import { checkFixableCases, checkFixedCases } from '../utils'

// -----------------
// Fixed Size
// -----------------
test('composites: fixed size tuple of ints', (t) => {
  const cases = [
    [1, 2, 0xff],
    [0, 1, 2],
  ]
  const offsets = [0, 4]
  const beet = fixedSizeTuple([u8, u32, i16])

  checkFixedCases(offsets, cases, beet, t)
  t.end()
})

test('composites: fixed size tuple of strings', (t) => {
  const cases = [
    ['abc', '*def', '😁'],
    ['aaa', 'bbbb', '*&#@'],
  ]
  const offsets = [0, 3]
  const beet = fixedSizeTuple([
    fixedSizeUtf8String(3),
    fixedSizeUtf8String(4),
    fixedSizeUtf8String(4),
  ])

  checkFixedCases(offsets, cases, beet, t)
  t.end()
})

// -----------------
// Fixable
// -----------------
test('composites: tuple of strings', (t) => {
  const cases = [
    ['abc ', '***def', '😁'],
    ['aaaa', 'bbbbbbbbb', '*&#@'],
  ]
  const offsets = [0, 3]
  const beet = tuple([utf8String, utf8String, fixedSizeUtf8String(4)])

  checkFixableCases(offsets, cases, beet, t)
  t.end()
})
