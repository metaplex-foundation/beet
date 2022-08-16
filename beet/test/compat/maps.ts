import test from 'tape'
import { u8, map } from '../../src/beet'
import { checkFixedSerialization } from '../utils'
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
    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    const m: Map<number, number> = hashToMap(value, parseInt)
    checkFixedSerialization(t, fixedBeetFromData, m, data)

    const fixedBeetFromValue = beet.toFixedFromValue(m)
    checkFixedSerialization(t, fixedBeetFromValue, m, data)
  }
  t.end()
})

// NOTE: this merly confirms that HashMap and BTreeMap data is layed out the same way when serialized
test('compat maps top level: BTreeMap<u8, u8>', (t) => {
  const beet = map(u8, u8)
  for (const { value, data } of fixture.btree_map_u8_u8s) {
    const fixedBeetFromData = beet.toFixedFromData(Buffer.from(data), 0)
    const m: Map<number, number> = hashToMap(value, parseInt)
    checkFixedSerialization(t, fixedBeetFromData, m, data)

    const fixedBeetFromValue = beet.toFixedFromValue(m)
    checkFixedSerialization(t, fixedBeetFromValue, m, data)
  }
  t.end()
})
