import test from 'tape'
import spok from 'spok'
import { PROGRAM_ID, Results, Trader, withDecodedBytes } from './utils'
import { GpaBuilder } from 'src/beet-solana'

test('gpa: fixed struct nested inside fixed struct', (t) => {
  // Expected Filters
  const nameFilter = (name: string) => ({
    memcmp: {
      offset: 0,
      bytes: Buffer.concat([
        Buffer.from([4, 0, 0, 0]), // length
        Buffer.from(name),
      ]),
    },
  })
  const ageFilter = (age: number) => ({
    memcmp: { offset: 15, bytes: Buffer.from([age]) },
  })

  const resultsFilter = (results: Results) => {
    const bytes = Results.struct.serialize(results)[0]
    return {
      memcmp: {
        offset: 8,
        bytes,
      },
    }
  }

  // Prep
  let gpaBuilder: GpaBuilder<Trader> = GpaBuilder.fromStruct<Trader>(
    PROGRAM_ID,
    Trader.struct
  )
  function prepCase(comment: string) {
    t.comment(comment)
    gpaBuilder = GpaBuilder.fromStruct<Trader>(PROGRAM_ID, Trader.struct)
  }

  // Tests
  prepCase(
    `name whic is before results struct - gpaBuilder.addFilter('name', 'trad')`
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
