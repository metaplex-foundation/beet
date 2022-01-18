use anyhow::Result;

use serde::{Deserialize, Serialize};

use crate::samples::{produce_samples, produce_stringified_samples, Sample};

#[derive(Serialize, Deserialize)]
pub struct Simple {
    strings: Vec<Sample<String>>,
    u8s: Vec<Sample<u8>>,
    u128s: Vec<Sample<String>>,
}

pub fn produce_simple() -> Result<Simple> {
    let strings: Vec<String> = vec!["", "Bob", "Harry and Bob"]
        .into_iter()
        .map(|x| x.to_string())
        .collect();

    let strings = produce_samples(strings)?;
    let u8s = produce_samples(vec![0, 1, 255])?;
    let u128s = produce_stringified_samples(vec![0, 255, u128::MAX])?;

    Ok(Simple {
        strings,
        u8s,
        u128s,
    })
}
