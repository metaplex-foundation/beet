import {
  BeetStruct,
  FixableBeetStruct,
  fixedSizeUtf8String,
  i32,
  u16,
  u8,
  utf8String,
} from '@metaplex-foundation/beet'
import {
  GetProgramAccountsConfig,
  GetProgramAccountsFilter,
  MemcmpFilter,
  PublicKey,
} from '@solana/web3.js'
import base58 from 'bs58'
import * as util from 'util'

export const PROGRAM_ID = new PublicKey(
  'cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ'
)

export function inspect(obj: any, colors = true) {
  console.log(util.inspect(obj, { colors, depth: 5 }))
}

export function dbg(obj: any) {
  inspect(obj)
  return obj
}

export function isMemcmpFilter(x: GetProgramAccountsFilter): x is MemcmpFilter {
  return (x as MemcmpFilter).memcmp != null
}

export function withDecodedBytes(config: GetProgramAccountsConfig) {
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

// -----------------
// Sample Structs
// -----------------
export type ResultsArgs = Pick<Results, 'win' | 'totalWin' | 'losses'>
export class Results {
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
    (args: ResultsArgs) => new Results(args.win!, args.totalWin!, args.losses!),
    'Results'
  )
}

export type TraderArgs = Pick<Trader, 'name' | 'results' | 'age'>
export class Trader {
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

export type IntAndStringArgs = Pick<IntAndString, 'theInt' | 'theString'>
export class IntAndString {
  constructor(readonly theInt: number, readonly theString: string) {}

  static readonly struct = new FixableBeetStruct<
    IntAndString,
    IntAndStringArgs
  >(
    [
      ['theInt', u8],
      ['theString', utf8String],
    ],
    (args) => new IntAndString(args.theInt!, args.theString!),
    'Trader'
  )
}

// Expected Filters
export const stringFilter = (offset: number, s: string) => ({
  memcmp: {
    offset,
    bytes: Buffer.concat([
      Buffer.from([s.length, 0, 0, 0]), // length
      Buffer.from(s),
    ]),
  },
})

export const nameFilter = (name: string) => stringFilter(0, name)

export const ageFilter = (age: number) => ({
  memcmp: { offset: 15, bytes: Buffer.from([age]) },
})

export const resultsFilter = (results: Results) => {
  const bytes = Results.struct.serialize(results)[0]
  return {
    memcmp: {
      offset: 8,
      bytes,
    },
  }
}
