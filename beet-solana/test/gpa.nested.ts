import test from 'tape'
import spok from 'spok'
import {
  ageFilter,
  nameFilter,
  resultsFilter,
  PROGRAM_ID,
  Trader,
  withDecodedBytes,
} from './utils'
import { GpaBuilder } from '../src/beet-solana'

test('gpa: fixed struct nested inside fixed struct', (t) => {
  let gpaBuilder: GpaBuilder<Trader> = GpaBuilder.fromStruct<Trader>(
    PROGRAM_ID,
    Trader.struct
  )
  function prepCase(comment: string) {
    t.comment(comment)
    gpaBuilder = GpaBuilder.fromStruct<Trader>(PROGRAM_ID, Trader.struct)
  }

  prepCase(
    `name which is before results struct - gpaBuilder.addFilter('name', 'trad')`
  )
  gpaBuilder.addFilter('name', 'trad')
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [nameFilter('trad')],
  })

  prepCase(
    `age which is after results struct - gpaBuilder.addFilter('age', 99)`
  )
  gpaBuilder.addFilter('age', 99)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [ageFilter(99)],
  })

  prepCase(`gpaBuilder.addFilter('name', 'trad').addFilter('age', 99)`)
  gpaBuilder.addFilter('name', 'trad').addFilter('age', 99)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [nameFilter('trad'), ageFilter(99)],
  })

  prepCase(`gpaBuilder.addFilter('results', { win, totalWin, losses })`)
  const results = {
    win: 3,
    totalWin: 4,
    losses: -100,
  }
  gpaBuilder.addFilter('results', results)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [resultsFilter(results)],
  })

  t.end()
})

test('gpa: fixed struct nested inside fixed struct - filter inner struct', (t) => {
  let gpaBuilder: GpaBuilder<Trader> = GpaBuilder.fromStruct<Trader>(
    PROGRAM_ID,
    Trader.struct
  )
  function prepCase(comment: string) {
    t.comment(comment)
    gpaBuilder = GpaBuilder.fromStruct<Trader>(PROGRAM_ID, Trader.struct)
  }

  // -----------------
  // Success Cases
  // -----------------
  prepCase(`gpaBuilder.addInnerFilter('results.win', 2)`)
  gpaBuilder.addInnerFilter('results.win', 2)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [{ memcmp: { offset: 8, bytes: Buffer.from([2]) } }],
  })

  prepCase(`gpaBuilder.addInnerFilter('results.totalWin', 8)`)
  gpaBuilder.addInnerFilter('results.totalWin', 8)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [{ memcmp: { offset: 9, bytes: Buffer.from([8]) } }],
  })

  prepCase(`gpaBuilder.addInnerFilter('results.losses', -678)`)
  gpaBuilder.addInnerFilter('results.losses', -678)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [{ memcmp: { offset: 11, bytes: Buffer.from([-678]) } }],
  })

  prepCase(
    `gpaBuilder.addInnerFilter('results.totalWin', 8).addInnerFilter('results.win', 2)`
  )
  gpaBuilder
    .addInnerFilter('results.totalWin', 8)
    .addInnerFilter('results.win', 2)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [
      { memcmp: { offset: 9, bytes: Buffer.from([8]) } },
      { memcmp: { offset: 8, bytes: Buffer.from([2]) } },
    ],
  })

  // -----------------
  // Failure Cases
  // -----------------

  t.throws(
    () => gpaBuilder.addInnerFilter('result.win', 2),
    /Outer filter key needs to be an existing field/i,
    'invalid outer field'
  )
  t.throws(
    () => gpaBuilder.addInnerFilter('results.wiin', 2),
    /wiin is not a field of the results struct/i,
    'invalid inner field'
  )
  t.throws(
    () => gpaBuilder.addInnerFilter('results.win.nested', 2),
    /inner filters can go only one level deep/i,
    'invalid three level nesting'
  )
  t.end()
})
