use std::collections::{BTreeMap, HashMap};

use anyhow::Result;

use serde::{Deserialize, Serialize};

use crate::samples::{produce_samples, Sample};

#[derive(Serialize, Deserialize)]
pub struct Maps {
    hash_map_u8_u8s: Vec<Sample<HashMap<u8, u8>>>,
    btree_map_u8_u8s: Vec<Sample<BTreeMap<u8, u8>>>,
    hash_map_string_i32s: Vec<Sample<HashMap<String, i32>>>,
    hash_map_string_vec_i8s: Vec<Sample<HashMap<String, Vec<i8>>>>,
    vec_hash_map_string_i64s: Vec<Sample<Vec<HashMap<String, i64>>>>,
}

pub fn produce_maps() -> Result<Maps> {
    let p1 = [(1, 11), (2, 12), (3, 13)];
    let p2 = [(11, 111), (22, 122), (33, 133)];
    let p3 = [(111, 110), (222, 220), (255, 250)];

    let hash_map_u8_u8s = {
        let hm1 = HashMap::from(p1);
        let hm2 = HashMap::from(p2);
        let hm3 = HashMap::from(p3);
        produce_samples(vec![hm1, hm2, hm3])?
    };

    let btree_map_u8_u8s = {
        let btm1 = BTreeMap::from(p1);
        let btm2 = BTreeMap::from(p2);
        let btm3 = BTreeMap::from(p3);
        produce_samples(vec![btm1, btm2, btm3])?
    };

    let hash_map_string_i32s = {
        let hm1 = HashMap::from([
            ("Uno".to_string(), -3),
            ("Dos".to_string(), -1),
            ("Tres".to_string(), 2),
        ]);
        let hm2 = HashMap::from([
            ("Eins".to_string(), 3),
            ("Zwei".to_string(), 1),
            ("Drei".to_string(), -3),
            ("Vier".to_string(), 0),
        ]);
        produce_samples(vec![hm1, hm2])?
    };

    let hash_map_string_vec_i8s = {
        let hm1 = HashMap::from([
            ("Uno".to_string(), vec![-3, -2, -1]),
            ("Dos".to_string(), vec![-1, 0, 1, 2, 3, 4]),
            ("Tres".to_string(), vec![-3, -2, -1, 0, 1]),
        ]);
        let hm2 = HashMap::from([
            ("Eins".to_string(), vec![3, 2, 1]),
            ("Zwei".to_string(), vec![1, 0, -1, -2, -3, -4]),
            ("Drei".to_string(), vec![-3, -2, -1, 0, 1]),
            ("Vier".to_string(), vec![]),
        ]);
        produce_samples(vec![hm1, hm2])?
    };

    let vec_hash_map_string_i64s = {
        let hm1 = HashMap::from([
            ("Uno".to_string(), -3),
            ("Dos".to_string(), -1),
            ("Tres".to_string(), 2),
        ]);
        let hm2 = HashMap::from([
            ("Eins".to_string(), 3),
            ("Zwei".to_string(), 1),
            ("Drei".to_string(), -3),
            ("Vier".to_string(), 0),
        ]);
        produce_samples(vec![vec![hm1.clone(), hm2.clone()], vec![hm2, hm1]])?
    };

    Ok(Maps {
        hash_map_u8_u8s,
        btree_map_u8_u8s,
        hash_map_string_i32s,
        hash_map_string_vec_i8s,
        vec_hash_map_string_i64s,
    })
}
