import spok, { Specifications } from 'spok'
import test from 'tape'
import { BeetStruct, coption, COption, u32, u8 } from '../src/beet'
import {
  dynamicSizeArray,
  dynamicSizeUtf8String,
  toFixed,
} from '../src/beet.dynamic'
import { DynamicBeetArgsStruct } from '../src/struct.dynamic'
import { deepLog } from './utils'

test('toFixed: struct with top level vec', (t) => {
  type Args = {
    ids: number[]
    count: number
  }
  const struct = new DynamicBeetArgsStruct<Args>(
    [
      ['ids', dynamicSizeArray(u32)],
      ['count', u32],
    ],
    'VecStruct'
  )
  {
    t.comment('+++ not providing length for ids')
    try {
      struct.toFixedFromMap(new Map())
      t.fail('should throw for missing map entry')
    } catch (err: any) {
      t.match(err.message, /ids: .+ not fixed.+missing a lengths entry/)
    }
  }

  t.end()
})

test('toFixed: struct with top level string', (t) => {
  type Args = {
    name: string
    age: number
  }

  const struct = new DynamicBeetArgsStruct<Args>(
    [
      ['name', dynamicSizeUtf8String],
      ['age', u8],
    ],
    'CustomerStruct'
  )

  const fixed = struct.toFixedFromMap(new Map().set('name', [8]))
  spok(t, fixed, <Specifications<BeetStruct<Args>>>{
    fields: [
      [
        'name',
        {
          byteSize: 12,
          description: 'Utf8String(8)',
        },
      ],
      [
        'age',
        {
          byteSize: 1,
          description: 'u8',
        },
      ],
    ],
    byteSize: 13,
    description: 'FixedCustomerStruct',
  })
  t.end()
})

test('toFixed: struct with nested vec and string', (t) => {
  type Args = {
    maybeIds: COption<number[]>
    contributors: string[]
  }
  const struct = new DynamicBeetArgsStruct<Args>(
    [
      ['maybeIds', coption(dynamicSizeArray(u32))],
      ['contributors', dynamicSizeArray(dynamicSizeUtf8String)],
    ],
    'NestedStruct'
  )
  {
    t.comment('+++ with valid lengths map')
    const fixed = struct.toFixedFromMap(
      new Map().set('maybeIds', [8]).set('contributors', [2, 16])
    )

    spok(t, fixed, <Specifications<BeetStruct<Args>>>{
      fields: [
        [
          'maybeIds',
          {
            byteSize: 4 + 4 + 8 * 4,
            description: 'COption<Array<u32>(8)>',
          },
        ],
        [
          'contributors',
          {
            byteSize: 4 + 2 * (4 + 16),
            description: 'Array<Utf8String(16)>(2)',
          },
        ],
      ],
      description: 'FixedNestedStruct',
      byteSize: 84,
    })
  }

  {
    t.comment('+++ with incomplete contributor length map')
    try {
      struct.toFixedFromMap(
        new Map().set('maybeIds', [8]).set('contributors', [2])
      )
      t.fail('should throw')
    } catch (err: any) {
      t.match(err.message, /provide enough.+lengths.+DynamicArray<Utf8String>/i)
    }
  }

  t.end()
})

// -----------------
// Nested Struct
// -----------------

test('toFixed: struct with top level string nested inside other struct', (t) => {
  type InnerArgs = {
    name: string
    age: number
  }
  const innerStruct = new DynamicBeetArgsStruct<InnerArgs>(
    [
      ['name', dynamicSizeUtf8String],
      ['age', u8],
    ],
    'InnerStruct'
  )
  const innerMap = new Map().set('name', [8])

  const beet = coption(innerStruct)
  const fixed = toFixed(beet, [], [innerMap])
  spok(t, fixed, {
    byteSize: 4 + 4 + 8 + 1,
    description: 'COption<FixedInnerStruct>',
  })

  t.end()
})
