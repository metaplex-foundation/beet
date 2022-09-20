import test from 'tape'
import { u8, utf8String, array, set } from '../../src/beet'
import { checkFixedDeserialize, checkSetSerialize } from '../utils'
import fixture from './fixtures/sets.json'

function arrToSet<K>(arr: Array<K>): Set<K> {
  return new Set(arr)
}

test('compat sets top level: HashSet<u8>', (t) => {
  const beet = set(u8)
  for (const { value, data } of fixture.hash_set_u8s.slice(0, 1)) {
    const s: Set<number> = arrToSet(value)

    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedDeserialize(t, fixedBeetFromData, s, data)
    checkSetSerialize(t, s, fixedBeetFromData, u8)

    const fixedBeetFromValue = beet.toFixedFromValue(s)
    checkFixedDeserialize(t, fixedBeetFromValue, s, data)
    checkSetSerialize(t, s, fixedBeetFromValue, u8)
  }
  t.end()
})

// NOTE: this merely confirms that HashSet and BTreeSet data is layed out the same way when serialized
test('compat sets top level: BTreeSet<u8>', (t) => {
  const beet = set(u8)
  for (const { value, data } of fixture.btree_set_u8s) {
    const s: Set<number> = arrToSet(value)

    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedDeserialize(t, fixedBeetFromData, s, data)
    checkSetSerialize(t, s, fixedBeetFromData, u8)

    const fixedBeetFromValue = beet.toFixedFromValue(s)
    checkFixedDeserialize(t, fixedBeetFromValue, s, data)
    checkSetSerialize(t, s, fixedBeetFromValue, u8)
  }
  t.end()
})

test('compat sets top level: HashSet<string>', (t) => {
  const beet = set(utf8String)
  for (const { value, data } of fixture.hash_set_strings) {
    const s: Set<string> = arrToSet(value)
    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedDeserialize(t, fixedBeetFromData, s, data)
    checkSetSerialize(t, s, fixedBeetFromData, utf8String)

    const fixedBeetFromValue = beet.toFixedFromValue(s)
    checkFixedDeserialize(t, fixedBeetFromValue, s, data)
    checkSetSerialize(t, s, fixedBeetFromValue, utf8String)
  }
  t.end()
})

test('compat sets top level: Vec<HashSet<string>>', (t) => {
  const beet = array(set(utf8String))
  for (const { value, data } of fixture.vec_hash_set_strings) {
    const xs: Set<string>[] = value.map(arrToSet)

    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedDeserialize(t, fixedBeetFromData, xs, data)

    const fixedBeetFromValue = beet.toFixedFromValue(xs)
    checkFixedDeserialize(t, fixedBeetFromValue, xs, data)
  }
  t.end()
})
