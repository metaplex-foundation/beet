import test from 'tape'

import fixture from './fixtures/data_enums.json'
import {
  checkFixableFromDataSerialization,
  checkFixableFromValueSerialization,
} from '../utils'
import {
  array,
  BeetArgsStruct,
  dataEnum,
  FixableBeetArgsStruct,
  u32,
  u8,
  uniformFixedSizeArray,
  utf8String,
} from '../../src/beet'

function convertToKindData(value: any) {
  // The compat rust tool JSON-stringifies the data, enum however we represent this as a
  // discriminated union with a __kind field.
  const [key, val] = Object.entries(value)[0]
  return { __kind: key, ...(val as object) }
}

test('compat data enums: simples', (t) => {
  type Simples = typeof fixture.simples[number]['value']
  const beet = dataEnum<Simples>([
    ['First', new BeetArgsStruct([['first_field', u32]])],
    ['Second', new BeetArgsStruct([['second_field', u32]])],
  ])

  for (const { value, data } of fixture.simples) {
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
      `${val.__kind} from data`
    )
  }
  t.end()
})

test('compat data enums: CollectionInfo', (t) => {
  type Collections = typeof fixture.collections[number]['value']
  const beet = dataEnum<Collections>([
    [
      'V1',
      new FixableBeetArgsStruct([
        ['symbol', utf8String],
        ['verified_creators', array(u8)],
        ['whitelist_root', uniformFixedSizeArray(u8, 32)],
      ]),
    ],
    ['V2', new FixableBeetArgsStruct([['collection_mint', u8]])],
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
