use anyhow::Result;

use serde::{Deserialize, Serialize};

use crate::samples::{produce_samples, Sample};

#[derive(Serialize, Deserialize)]
pub struct Options {
    strings: Vec<Sample<Vec<String>>>,
    u8s: Vec<Sample<Vec<u8>>>,
}

pub fn produce_vecs() -> Result<Options> {
    let strings = produce_samples(vec![
        vec![],
        vec![String::from("")],
        vec![String::from("Bob")],
        vec![String::from("Bob"), String::from("Harry and Luise")],
    ])?;
    let u8s = produce_samples(vec![vec![], vec![0], vec![0, 1, 255]])?;

    Ok(Options { strings, u8s })
}
