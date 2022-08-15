use std::collections::HashMap;

use anyhow::Result;

use serde::{Deserialize, Serialize};

use crate::samples::{produce_samples, Sample};

#[derive(Serialize, Deserialize)]
pub struct Maps {
    hash_map_u8_u8s: Vec<Sample<HashMap<u8, u8>>>,
}

pub fn produce_maps() -> Result<Maps> {
    let hm1 = {
        let mut m = HashMap::new();
        m.insert(1, 11);
        m.insert(2, 12);
        m.insert(3, 13);
        m
    };
    let hm2 = {
        let mut m = HashMap::new();
        m.insert(11, 111);
        m.insert(22, 122);
        m.insert(33, 133);
        m
    };
    let hm3 = {
        let mut m = HashMap::new();
        m.insert(111, 110);
        m.insert(222, 220);
        m.insert(255, 250);
        m
    };
    let hash_map_u8_u8s = produce_samples(vec![hm1, hm2, hm3])?;

    Ok(Maps { hash_map_u8_u8s })
}
