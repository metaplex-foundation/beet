import test from 'tape'
import { u8, map, utf8String, i8, array, i32 } from '../../src/beet'
import { checkFixedDeserialize, checkMapSerialize } from '../utils'
import fixture from './fixtures/maps.json'

function hashToMap<K extends keyof any, V>(
  hash: any,
  keyConverter: (k: string) => any = (k) => k
): Map<K, V> {
  const map = new Map()
  for (const [k, v] of Object.entries(hash)) {
    // NOTE: that the compat data is JSON and thus all keys are represented as strings
    // we fix that here
    map.set(keyConverter(k), v)
  }
  return map
}

test('compat maps top level: HashMap<u8, u8>', (t) => {
  const beet = map(u8, u8)
  for (const { value, data } of fixture.hash_map_u8_u8s) {
    const m: Map<number, number> = hashToMap(value, parseInt)

    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedDeserialize(t, fixedBeetFromData, m, data)
    checkMapSerialize(t, m, fixedBeetFromData, u8, u8)

    const fixedBeetFromValue = beet.toFixedFromValue(m)
    checkFixedDeserialize(t, fixedBeetFromValue, m, data)
    checkMapSerialize(t, m, fixedBeetFromValue, u8, u8)
  }
  t.end()
})

// NOTE: this merely confirms that HashMap and BTreeMap data is layed out the same way when serialized
test('compat maps top level: BTreeMap<u8, u8>', (t) => {
  const beet = map(u8, u8)
  for (const { value, data } of fixture.btree_map_u8_u8s) {
    const m: Map<number, number> = hashToMap(value, parseInt)

    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedDeserialize(t, fixedBeetFromData, m, data)
    checkMapSerialize(t, m, fixedBeetFromData, u8, u8)

    const fixedBeetFromValue = beet.toFixedFromValue(m)
    checkFixedDeserialize(t, fixedBeetFromValue, m, data)
    checkMapSerialize(t, m, fixedBeetFromValue, u8, u8)
  }
  t.end()
})

test('compat maps top level: HashMap<string, i32>', (t) => {
  const beet = map(utf8String, i32)
  for (const { value, data } of fixture.hash_map_string_i32s) {
    const m: Map<string, number> = hashToMap(value)
    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    checkFixedDeserialize(t, fixedBeetFromData, m, data)
    checkMapSerialize(t, m, fixedBeetFromData, utf8String, i32)

    const fixedBeetFromValue = beet.toFixedFromValue(m)
    checkFixedDeserialize(t, fixedBeetFromValue, m, data)
    checkMapSerialize(t, m, fixedBeetFromValue, utf8String, i32)
  }
  t.end()
})

/*
test('compat maps top level: HashMap<string, i8[]>', (t) => {
  const beet = map(utf8String, array(i8))
  for (const { value, data } of fixture.hash_map_string_vec_i8s) {
    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    const m: Map<string, number[]> = hashToMap(value)
    checkFixedSerialization(t, fixedBeetFromData, m, data)

    const fixedBeetFromValue = beet.toFixedFromValue(m)
    checkFixedSerialization(t, fixedBeetFromValue, m, data)
  }
  t.end()
})
*/
