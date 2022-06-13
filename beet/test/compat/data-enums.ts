import test from 'tape'

import fixture from './fixtures/data_enums.json'
import {
  checkFixableFromDataSerialization,
  checkFixableFromValueSerialization,
} from '../utils'
import {
  array,
  BeetArgsStruct,
  EnumDataVariant,
  dataEnum,
  FixableBeetArgsStruct,
  u32,
  u8,
  uniformFixedSizeArray,
  utf8String,
} from '../../src/beet'

function convertToKindData(value: any) {
  // The compat rust tool JSON stringifies the data enum however we represent this as a
  // discriminated union with a __kind field.
  const [key, val] = Object.entries(value)[0]
  return { __kind: key, ...(val as object) }
}

test('compat data enums: simples', (t) => {
  type DataEnumKind<T> = keyof T
  type DataEnumKeyAsKind<T> = {
    [K in keyof T]: { __kind: K } & T[K]
  }[keyof T]

  // type SimpleKind = 'First' | 'Second'
  type SimpleVariants =
    | EnumDataVariant<
        'First',
        {
          first_field: number
        }
      >
    | EnumDataVariant<
        'Second',
        {
          second_field: number
        }
      >

  type Simples = {
    First: { first_field: number }
    Second: { second_field: number }
  }
  const SimplesBeet = {
    First: new BeetArgsStruct([['first_field', u32]]),
    Second: new BeetArgsStruct([['second_field', u32]]),
  }

  const beet = dataEnum<Simples, DataEnumKind<Simples>>([
    {
      __kind: 'First',
      dataBeet: SimplesBeet.First,
    },
    {
      __kind: 'Second',
      dataBeet: SimplesBeet.Second,
    },
  ])

  for (const { value, data } of fixture.simples) {
    const val = convertToKindData(value) as SimpleVariants

    // TODO(thlorenz): work out types to not need 'as Simples' ideally
    const fixedBeet = beet.toFixedFromData(Buffer.from(data), 0)
    const res = fixedBeet.read(Buffer.from(data), 0)

    checkFixableFromDataSerialization(
      t,
      beet,
      val,
      data,
      `${val.__kind} from data`
    )
    checkFixableFromValueSerialization(
      t,
      beet,
      val,
      data,
      `${val.__kind} from data`
    )
  }
  t.end()
})

test('compat data enums: CollectionInfo', (t) => {
  // type CollectionInfoKind = 'V1' | 'V2'

  const beet = dataEnum([
    {
      __kind: 'V1',
      dataBeet: new FixableBeetArgsStruct([
        ['symbol', utf8String],
        ['verified_creators', array(u8)],
        ['whitelist_root', uniformFixedSizeArray(u8, 32)],
      ]),
    },
    {
      __kind: 'V2',
      dataBeet: new FixableBeetArgsStruct([['collection_mint', u8]]),
    },
  ])

  for (const { value, data } of fixture.collections) {
    const val = convertToKindData(value)
    checkFixableFromDataSerialization(
      t,
      beet,
      val,
      data,
      `${val.__kind} from data`
    )
    checkFixableFromValueSerialization(
      t,
      beet,
      val,
      data,
      `${val.__kind} from value`
    )
  }
  t.end()
})
