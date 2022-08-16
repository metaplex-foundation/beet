use std::collections::{BTreeMap, HashMap};

use anyhow::Result;

use serde::{Deserialize, Serialize};

use crate::samples::{produce_samples, Sample};

#[derive(Serialize, Deserialize)]
pub struct Maps {
    hash_map_u8_u8s: Vec<Sample<HashMap<u8, u8>>>,
    btree_map_u8_u8s: Vec<Sample<BTreeMap<u8, u8>>>,
}

pub fn produce_maps() -> Result<Maps> {
    let p1 = [(1, 11), (2, 12), (3, 13)];
    let p2 = [(11, 111), (22, 122), (33, 133)];
    let p3 = [(111, 110), (222, 220), (255, 250)];

    let hm1 = HashMap::from(p1);
    let hm2 = HashMap::from(p2);
    let hm3 = HashMap::from(p3);
    let hash_map_u8_u8s = produce_samples(vec![hm1, hm2, hm3])?;

    let btm1 = BTreeMap::from(p1);
    let btm2 = BTreeMap::from(p2);
    let btm3 = BTreeMap::from(p3);
    let btree_map_u8_u8s = produce_samples(vec![btm1, btm2, btm3])?;

    Ok(Maps {
        hash_map_u8_u8s,
        btree_map_u8_u8s,
    })
}
