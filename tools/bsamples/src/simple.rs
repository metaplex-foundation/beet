use anyhow::Result;

use serde::{Deserialize, Serialize};

use crate::samples::{produce_samples, Sample};

#[derive(Serialize, Deserialize)]
pub struct Simple {
    strings: Vec<Sample<String>>,
    u8s: Vec<Sample<u8>>,
    u128s: Vec<Sample<u128>>,
    optu8s: Vec<Sample<Option<u8>>>,
}

pub fn produce_simple() -> Result<Simple> {
    let strings: Vec<String> = vec!["", "Bob", "Harry and Bob"]
        .into_iter()
        .map(|x| x.to_string())
        .collect();

    let strings = produce_samples(strings)?;
    let u8s = produce_samples(vec![0, 1, 255])?;
    let u128s = produce_samples(vec![0, 255, u128::MAX])?;

    let optu8s = produce_samples(vec![None, Some(0), Some(1), Some(255)])?;

    Ok(Simple {
        strings,
        u8s,
        u128s,
        optu8s,
    })
}
