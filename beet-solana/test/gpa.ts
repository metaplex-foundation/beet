import test from 'tape'
import spok from 'spok'
import { BeetStruct } from '@metaplex-foundation/beet'
import { u8 } from '@metaplex-foundation/beet'
import {
  GetProgramAccountsConfig,
  GetProgramAccountsFilter,
  MemcmpFilter,
  PublicKey,
} from '@solana/web3.js'
import { GpaBuilder } from '../src/gpa'
import base58 from 'bs58'

import * as util from 'util'

const PROGRAM_ID = new PublicKey('cndy3Z4yapfJBmL3ShUp5exZKqR3z33thTzeNMm2gRZ')

// @ts-ignore
function inspect(obj: any, colors = true) {
  console.log(util.inspect(obj, { colors, depth: 5 }))
}

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
