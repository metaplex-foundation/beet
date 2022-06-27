import test from 'tape'
import spok from 'spok'
import {
  BeetStruct,
  fixedSizeUtf8String,
  i16,
  i32,
  u16,
} from '@metaplex-foundation/beet'
import { u8 } from '@metaplex-foundation/beet'
import {
  GetProgramAccountsConfig,
  GetProgramAccountsFilter,
  MemcmpFilter,
  PublicKey,
} from '@solana/web3.js'
import { GpaBuilder } from '../src/gpa'
import base58 from 'bs58'
import { dbg } from './utils'

const PROGRAM_ID = new PublicKey('cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ')

function isMemcmpFilter(x: GetProgramAccountsFilter): x is MemcmpFilter {
  return (x as MemcmpFilter).memcmp != null
}

function withDecodedBytes(config: GetProgramAccountsConfig) {
  const filters = []
  if (config.filters != null) {
    for (const x of config.filters) {
      if (isMemcmpFilter(x)) {
        filters.push({
          memcmp: {
            offset: x.memcmp.offset,
            bytes: base58.decode(x.memcmp.bytes),
          },
        })
      } else {
        filters.push({ dataSize: x.dataSize })
      }
    }
  }
  return { ...config, filters }
}

test('gpa: fixed struct with one u8', (t) => {
  type Args = {
    n: number
  }
  const struct = new BeetStruct([['n', u8]], (args) => args)

  let gpaBuilder: GpaBuilder<Args> = GpaBuilder.fromStruct(PROGRAM_ID, struct)
  function prepCase(comment: string) {
    t.comment(comment)
    gpaBuilder = GpaBuilder.fromStruct(PROGRAM_ID, struct)
  }

  t.deepEqual(gpaBuilder.config, {}, 'initially config is empty')

  prepCase(`gpaBuilder.addFilter('n', 2)`)
  gpaBuilder.addFilter('n', 2)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [{ memcmp: { offset: 0, bytes: Buffer.from([2]) } }],
  })

  t.end()
})

test('gpa: fixed struct with two u8s', (t) => {
  type Args = {
    n: number
    nn: number
  }
  const struct = new BeetStruct(
    [
      ['n', u8],
      ['nn', u8],
    ],
    (args) => args
  )

  let gpaBuilder: GpaBuilder<Args> = GpaBuilder.fromStruct(PROGRAM_ID, struct)
  function prepCase(comment: string) {
    t.comment(comment)
    gpaBuilder = GpaBuilder.fromStruct(PROGRAM_ID, struct)
  }

  t.deepEqual(gpaBuilder.config, {}, 'config is empty')

  prepCase(`gpaBuilder.addFilter('n', 2)`)
  gpaBuilder.addFilter('n', 2)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [{ memcmp: { offset: 0, bytes: Buffer.from([2]) } }],
  })

  prepCase(`gpaBuilder.addFilter('nn', 4)`)
  gpaBuilder.addFilter('nn', 4)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [{ memcmp: { offset: 1, bytes: Buffer.from([4]) } }],
  })

  prepCase(`add both of the above`)
  gpaBuilder.addFilter('n', 2).addFilter('nn', 4)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [
      {
        memcmp: { offset: 0, bytes: Buffer.from([2]) },
      },
      { memcmp: { offset: 1, bytes: Buffer.from([4]) } },
    ],
  })

  prepCase(`gpaBuilder.dataSize()`)
  gpaBuilder.dataSize()
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [{ dataSize: 2 }],
  })

  prepCase(`gpaBuilder.dataSize().addFilter('nn', 4)`)
  gpaBuilder.dataSize().addFilter('nn', 4)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [
      { dataSize: 2 },
      { memcmp: { offset: 1, bytes: Buffer.from([4]) } },
    ],
  })

  t.end()
})

type ResultsArgs = Pick<Results, 'win' | 'totalWin' | 'losses'>
class Results {
  constructor(
    readonly win: number,
    readonly totalWin: number,
    readonly losses: number
  ) {}

  static readonly struct = new BeetStruct<Results, ResultsArgs>(
    [
      ['win', u8],
      ['totalWin', u16],
      ['losses', i32],
    ],
    (args) => new Results(args.win!, args.totalWin!, args.losses!),
    'Results'
  )
}

type TraderArgs = Pick<Trader, 'name' | 'results' | 'age'>
class Trader {
  constructor(
    readonly name: string,
    readonly results: Results,
    readonly age: number
  ) {}

  static readonly struct = new BeetStruct<Trader, TraderArgs>(
    [
      ['name', fixedSizeUtf8String(4)], // offset: 0 (size: 2 * 4)
      ['results', Results.struct], // offset: 8 (size: 7)
      ['age', u8], // offset: 8 + 7 = 15
    ],
    (args) => new Trader(args.name!, args.results!, args.age!),
    'Trader'
  )
}

test('gpa: fixed struct with three ints', (t) => {
  let gpaBuilder: GpaBuilder<Results> = GpaBuilder.fromStruct<Results>(
    PROGRAM_ID,
    Results.struct
  )
  function prepCase(comment: string) {
    t.comment(comment)
    gpaBuilder = GpaBuilder.fromStruct<Results>(PROGRAM_ID, Results.struct)
  }

  prepCase(`gpaBuilder.addFilter('win', 2)`)
  gpaBuilder.addFilter('win', 2)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [{ memcmp: { offset: 0, bytes: Buffer.from([2]) } }],
  })

  prepCase(`gpaBuilder.addFilter('totalWin', 8)`)
  gpaBuilder.addFilter('totalWin', 8)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [{ memcmp: { offset: 1, bytes: Buffer.from([8]) } }],
  })

  prepCase(`gpaBuilder.addFilter('losses', -7)`)
  gpaBuilder.addFilter('losses', -7)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [{ memcmp: { offset: 3, bytes: Buffer.from([-7]) } }],
  })

  prepCase(`gpaBuilder.addFilter('totalWin', 8).addFilter('losses', -7)`)
  gpaBuilder.addFilter('totalWin', 8).addFilter('losses', -7)
  spok(t, withDecodedBytes(gpaBuilder.config), {
    filters: [
      { memcmp: { offset: 1, bytes: Buffer.from([8]) } },
      { memcmp: { offset: 3, bytes: Buffer.from([-7]) } },
    ],
  })

  t.end()
})

test.only('gpa: fixed struct nested inside fixed struct', (t) => {
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
