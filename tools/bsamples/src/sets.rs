use std::collections::{BTreeSet, HashSet};

use anyhow::Result;

use serde::{Deserialize, Serialize};

use crate::samples::{produce_samples, Sample};

#[derive(Serialize, Deserialize)]
pub struct Sets {
    hash_set_u8s: Vec<Sample<HashSet<u8>>>,
    btree_set_u8s: Vec<Sample<BTreeSet<u8>>>,
    hash_set_strings: Vec<Sample<HashSet<String>>>,
    vec_hash_set_strings: Vec<Sample<Vec<HashSet<String>>>>,
}

pub fn produce_sets() -> Result<Sets> {
    let p1 = [1, 2, 3];
    let p2 = [11, 22, 33];
    let p3 = [111, 222, 255];

    let hash_set_u8s = {
        let hm1 = HashSet::from(p1);
        let hm2 = HashSet::from(p2);
        let hm3 = HashSet::from(p3);
        produce_samples(vec![hm1, hm2, hm3])?
    };

    let btree_set_u8s = {
        let btm1 = BTreeSet::from(p1);
        let btm2 = BTreeSet::from(p2);
        let btm3 = BTreeSet::from(p3);
        produce_samples(vec![btm1, btm2, btm3])?
    };

    let hash_set_strings = {
        let hm1 = HashSet::from(["Uno".to_string(), "Dos".to_string(), "Tres".to_string()]);
        let hm2 = HashSet::from([
            "Eins".to_string(),
            "Zwei".to_string(),
            "Drei".to_string(),
            "Vier".to_string(),
        ]);
        produce_samples(vec![hm1, hm2])?
    };

    let vec_hash_set_strings = {
        let hm1 = HashSet::from(["Uno".to_string(), "Dos".to_string(), "Tres".to_string()]);
        let hm2 = HashSet::from([
            "Eins".to_string(),
            "Zwei".to_string(),
            "Drei".to_string(),
            "Vier".to_string(),
        ]);
        produce_samples(vec![vec![hm1.clone(), hm2.clone()], vec![hm2, hm1]])?
    };

    Ok(Sets {
        hash_set_u8s,
        btree_set_u8s,
        hash_set_strings,
        vec_hash_set_strings,
    })
}
