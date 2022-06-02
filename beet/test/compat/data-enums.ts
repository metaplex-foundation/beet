import test from 'tape'

import fixture from './fixtures/data_enums.json'
import {
  checkFixableFromDataSerialization,
  checkFixableFromValueSerialization,
} from '../utils'
import { BeetArgsStruct, dataEnum, u32 } from '../../src/beet'

function convertToKindData(value: any) {
  // The compat rust tool JSON stringifies the data enum however we represent this as a
  // discriminated union with a __kind field.
  const [key, val] = Object.entries(value)[0]
  return { __kind: key, ...(val as object) }
}

test('compat data enums: simples', (t) => {
  const beet = dataEnum([
    {
      kind: 'First',
      dataBeet: new BeetArgsStruct([['first_field', u32]]),
    },
    {
      kind: 'Second',
      dataBeet: new BeetArgsStruct([['second_field', u32]]),
    },
  ])

  for (const { value, data } of fixture.simples.slice(0, 1)) {
    const val = convertToKindData(value)
    checkFixableFromDataSerialization(t, beet, val, data, 'simples from data')
    checkFixableFromValueSerialization(t, beet, val, data, 'simples form value')
  }
  t.end()
})
