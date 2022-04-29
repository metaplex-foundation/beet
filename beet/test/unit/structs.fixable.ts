import spok, { Specifications } from 'spok'
import test from 'tape'
import {
  array,
  Beet,
  BeetArgsStruct,
  bytes,
  coption,
  COption,
  FixableBeet,
  FixableBeetArgsStruct,
  u16,
  u32,
  u8,
  utf8String,
} from '../../src/beet'
import { deepLogBeet } from '../utils'

function verify<Args>(
  t: test.Test,
  structOrBeet: FixableBeet<Args> | FixableBeetArgsStruct<Args>,
  args: Args,
  expected: Specifications<BeetArgsStruct<Args>>,
  opts: { log?: boolean; argsForRoundTrip?: (args: Args) => Args } = {}
) {
  const { log = false, argsForRoundTrip: argsForRoundTrip = (args) => args } =
    opts
  // 1. Derive fixed struct or beet from provided args and check it
  const fixedFromArgs = structOrBeet.toFixedFromValue(args)
  if (log) {
    deepLogBeet(fixedFromArgs)
    return
  }
  spok(t, fixedFromArgs, expected, 'fixedFromArgs: ')

  // 2. Serialize args using the fixed struct or beet
  let data: Buffer
  if (typeof (fixedFromArgs as BeetArgsStruct<Args>).serialize === 'function') {
    // Struct
    data = (fixedFromArgs as BeetArgsStruct<Args>).serialize(args)[0]
  } else {
    // Beet
    data = Buffer.alloc(fixedFromArgs.byteSize)
    fixedFromArgs.write(data, 0, args)
  }

  // 3. Derive fixed struct or beet from serialized data
  const fixedFromData = structOrBeet.toFixedFromData(data, 0)
  spok(t, fixedFromData, expected, 'fixedFromData: ')

  // 4. Deserialize args from data via the beet or struct derived from data
  if (
    typeof (fixedFromData as BeetArgsStruct<Args>).deserialize === 'function'
  ) {
    // Struct
    const [deserializedArgs] = (
      fixedFromData as BeetArgsStruct<Args>
    ).deserialize(data)
    spok(t, deserializedArgs, {
      ...argsForRoundTrip(args),
      $topic: 'round-tripped',
    })
  } else {
    // Beet
    const deserializedArgs = fixedFromData.read(data, 0)
    spok(t, deserializedArgs, {
      ...argsForRoundTrip(args),
      $topic: 'round-tripped',
    })
  }
}
test('structs: fixable struct with top level vec', (t) => {
  type Args = {
    ids: number[]
    count: number
  }
  const struct = new FixableBeetArgsStruct<Args>(
    [
      ['ids', array(u32)],
      ['count', u32],
    ],
    'VecStruct'
  )
  {
    t.comment('+++ providing value missing count field')
    try {
      const args = { count: 1 } as unknown as Args
      struct.toFixedFromValue(args)
      t.fail('should throw for missing field entry')
    } catch (err: any) {
      t.match(err.message, /value with keys.+count.+should include.+ids/i)
    }
  }

  const expected = <Specifications<BeetArgsStruct<Args>>>{
    fields: [
      [
        'ids',
        { byteSize: 20, length: 4, description: 'Array<u32>(4)[ 4 + 16 ]' },
      ],
      ['count', { byteSize: 4, description: 'u32' }],
    ],
    description: 'VecStruct',
    byteSize: 24,
  }

  {
    t.comment('+++ providing value with all fields')
    const args = { ids: [1, 2, 3, 4], count: 1 }
    verify(t, struct, args, expected)
  }

  {
    t.comment('+++ providing value with more fields')
    const args = { ids: [1, 2, 3, 4], count: 1, name: 'bob' }
    verify(t, struct, args, expected, {
      argsForRoundTrip: (args) =>
        <typeof args>{
          ids: args.ids,
          count: args.count,
        },
    })
  }

  t.end()
})

test('structs: fixable struct with top level vec and bytes', (t) => {
  type Args = {
    ids: number[]
    data: Uint8Array
    count: number
  }
  const struct = new FixableBeetArgsStruct<Args>(
    [
      ['ids', array(u32)],
      ['data', bytes],
      ['count', u32],
    ],
    'VecStruct'
  )
  const expected = <Specifications<BeetArgsStruct<Args>>>{
    fields: [
      [
        'ids',
        { byteSize: 20, length: 4, description: 'Array<u32>(4)[ 4 + 16 ]' },
      ],
      ['data', { byteSize: 4 + 11, description: 'Uint8Array(11)' }],
      ['count', { byteSize: 4, description: 'u32' }],
    ],
    description: 'VecStruct',
    byteSize: 39,
  }

  const data = Buffer.from('hello world', 'utf8')
  {
    t.comment('+++ providing value with all fields')

    const args = {
      ids: [1, 2, 3, 4],
      data,
      count: 1,
    }
    console.log(args)
    const fixed = struct.toFixedFromValue(args)
    console.log({ fixed })
    const [serialized] = struct.serialize(args)
    console.log(serialized.toJSON().data)
    verify(t, struct, args, expected)
  }

  {
    t.comment('+++ providing value with more fields')
    const args = {
      ids: [1, 2, 3, 4],
      data,
      count: 1,
    }
    verify(t, struct, args, expected, {
      argsForRoundTrip: (args) =>
        <typeof args>{
          ids: args.ids,
          count: args.count,
        },
    })
  }

  t.end()
})
test('struct: fixable struct with top level string', (t) => {
  type Args = {
    name: string
    age: number
  }

  const struct = new FixableBeetArgsStruct<Args>(
    [
      ['name', utf8String],
      ['age', u8],
    ],
    'CustomerStruct'
  )
  const expected = <Specifications<BeetArgsStruct<Args>>>{
    fields: [
      [
        'name',
        {
          byteSize: 15,
          description: 'Utf8String(4 + 11)',
        },
      ],
      ['age', { byteSize: 1, description: 'u8' }],
    ],
    description: 'CustomerStruct',
    byteSize: 16,
  }

  const args = { name: 'Hello World', age: 18 }
  verify(t, struct, args, expected)

  t.end()
})

test('struct: fixable struct with nested vec and string', (t) => {
  type Args = {
    maybeIds: COption<number[]>
    contributors: string[]
  }
  const struct = new FixableBeetArgsStruct<Args>(
    [
      ['maybeIds', coption(array(u32))],
      ['contributors', array(utf8String)],
    ],
    'ContributorsStruct'
  )
  {
    t.comment('+++ with Some(maybeIds)')
    const args: Args = {
      maybeIds: [1, 2, 3],
      contributors: ['bob', 'alice'],
    }

    const expected = <Specifications<BeetArgsStruct<Args>>>{
      fields: [
        [
          'maybeIds',
          {
            description: 'COption<Array<u32>(3)[ 4 + 12 ]>[1 + 16]',
            byteSize: 17,
            inner: {
              byteSize: 16,
              length: 3,
              description: 'Array<u32>(3)[ 4 + 12 ]',
            },
          },
        ],
        [
          'contributors',
          {
            byteSize: 20,
            length: 2,
            description: 'Array<Utf8String(4 + 3)>(2)[ 4 + 16 ]',
          },
        ],
      ],
      description: 'ContributorsStruct',
      byteSize: 37,
    }

    verify(t, struct, args, expected)
  }

  {
    t.comment('+++ with None(maybeIds)')
    const args: Args = {
      maybeIds: null,
      contributors: ['bob', 'alice'],
    }

    const expected = <Specifications<BeetArgsStruct<Args>>>{
      fields: [
        [
          'maybeIds',
          {
            byteSize: 1,
            description: 'COption<None(array)>',
          },
        ],
        [
          'contributors',
          {
            byteSize: 20,
            length: 2,
            description: 'Array<Utf8String(4 + 3)>(2)[ 4 + 16 ]',
          },
        ],
      ],
      description: 'ContributorsStruct',
      byteSize: 21,
    }

    verify(t, struct, args, expected)
  }

  t.end()
})

// -----------------
// Nested Fixable Struct
// -----------------

test('fixable: struct with top level string nested inside other struct', (t) => {
  type InnerArgs = {
    name: string
    age: number
  }
  const innerStruct = new FixableBeetArgsStruct<InnerArgs>(
    [
      ['name', utf8String],
      ['age', u8],
    ],
    'InnerStruct'
  )
  const beet = coption(innerStruct)

  {
    t.comment('+++ with Some(args)')
    const args = { name: 'bob', age: 18 }
    verify(t, beet, args, <Specifications<typeof beet>>{
      description: 'COption<InnerStruct>[1 + 8]',
      byteSize: 9,
      inner: {
        fields: [
          [
            'name',
            {
              elementByteSize: 1,
              length: 3,
              byteSize: 7,
              description: 'Utf8String(4 + 3)',
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
        description: 'InnerStruct',
        byteSize: 8,
      },
    })
  }

  {
    t.comment('+++ with None(args)')
    const args = null
    verify(t, beet, args, <Specifications<Beet<InnerArgs>>>{
      byteSize: 1,
      description: 'COption<None(InnerStruct)>',
    })
  }

  t.end()
})

test('fixable: struct with top level string nested inside other struct', (t) => {
  type InnerArgs = {
    name: string
    age: number
  }
  type Args = {
    innerArgs: InnerArgs
  }

  const innerStruct = new FixableBeetArgsStruct<InnerArgs>(
    [
      ['name', utf8String],
      ['age', u8],
    ],
    'InnerStruct'
  )

  const struct = new FixableBeetArgsStruct<Args>(
    [['innerArgs', innerStruct]],
    'OuterStruct'
  )

  {
    t.comment('+++ Providing inner struct field')
    const args: Args = {
      innerArgs: {
        name: 'Bobby Tables',
        age: 18,
      },
    }
    verify(t, struct, args, <Specifications<BeetArgsStruct<Args>>>{
      fields: [
        [
          'innerArgs',
          {
            fields: [
              [
                'name',
                {
                  length: 12,
                  byteSize: 16,
                  description: 'Utf8String(4 + 12)',
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
            description: 'InnerStruct',
            byteSize: 17,
          },
        ],
      ],
      description: 'OuterStruct',
      byteSize: 17,
    })
  }
  {
    t.comment('+++ Not providing inner struct field')
    const args: Args = {
      //  @ts-ignore purposely providing different field
      someOtherField: 1,
    }
    try {
      verify(t, struct, args, <Specifications<BeetArgsStruct<Args>>>{})
      t.fail('should throw for missing field')
    } catch (err: any) {
      t.match(
        err.message,
        /value with keys.+someOtherField.+should include.+innerArgs/i
      )
    }
  }

  t.end()
})

test('toFixed: struct with nested struct and mixed nested fixable and fixed beets ', (t) => {
  type InnerArgs = {
    housePrices: COption<number[]>
    age: number
  }
  type Args = {
    innerArgs: InnerArgs
    name: string
    symbol: string
    count: number
  }

  const innerStruct = new FixableBeetArgsStruct<InnerArgs>(
    [
      ['housePrices', coption(array(u16))],
      ['age', u8],
    ],
    'InnerStruct'
  )
  const struct = new FixableBeetArgsStruct<Args>(
    [
      ['innerArgs', innerStruct],
      ['name', utf8String],
      ['symbol', utf8String],
      ['count', u8],
    ],
    'OuterStruct'
  )

  {
    t.comment('+++ inner struct with Some(housePrices)')
    const args: Args = {
      innerArgs: {
        housePrices: [10, 222, 4000],
        age: 200,
      },
      name: 'Alice',
      count: 2,
      symbol: 'CCC',
    }
    const expected = <Specifications<BeetArgsStruct<Args>>>{
      fields: [
        [
          'innerArgs',
          {
            fields: [
              [
                'housePrices',
                {
                  description: 'COption<Array<u16>(3)[ 4 + 6 ]>[1 + 10]',
                  byteSize: 11,
                  inner: {
                    byteSize: 10,
                    length: 3,
                    description: 'Array<u16>(3)[ 4 + 6 ]',
                  },
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
            description: 'InnerStruct',
            byteSize: 12,
          },
        ],
        [
          'name',
          {
            length: 5,
            byteSize: 9,
            description: 'Utf8String(4 + 5)',
          },
        ],
        [
          'symbol',
          {
            length: 3,
            byteSize: 7,
            description: 'Utf8String(4 + 3)',
          },
        ],
        ['count', { byteSize: 1, description: 'u8' }],
      ],
      description: 'OuterStruct',
      byteSize: 29,
    }
    verify(t, struct, args, expected)
  }

  {
    t.comment('+++ inner struct with None(housePrices)')
    const args: Args = {
      innerArgs: {
        housePrices: null,
        age: 200,
      },
      name: 'Alice',
      count: 2,
      symbol: 'CCC',
    }
    const expected = <Specifications<BeetArgsStruct<Args>>>{
      fields: [
        [
          'innerArgs',
          {
            fields: [
              [
                'housePrices',
                {
                  byteSize: 1,
                  description: 'COption<None(array)>',
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
            description: 'InnerStruct',
            byteSize: 2,
          },
        ],
        [
          'name',
          {
            length: 5,
            byteSize: 9,
            description: 'Utf8String(4 + 5)',
          },
        ],
        [
          'symbol',
          {
            length: 3,
            byteSize: 7,
            description: 'Utf8String(4 + 3)',
          },
        ],
        ['count', { byteSize: 1, description: 'u8' }],
      ],
      description: 'OuterStruct',
      byteSize: 19,
    }
    verify(t, struct, args, expected)
  }

  t.end()
})
