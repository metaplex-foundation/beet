use anyhow::Result;

use serde::{Deserialize, Serialize};

use crate::samples::{produce_samples, Sample};

#[derive(Serialize, Deserialize)]
pub struct Options {
    strings: Vec<Sample<Option<String>>>,
    u8s: Vec<Sample<Option<u8>>>,
}

pub fn produce_options() -> Result<Options> {
    let strings = produce_samples(vec![
        None,
        Some(String::from("Bob")),
        Some(String::from("Harry and Luise")),
    ])?;
    let u8s = produce_samples(vec![None, Some(0), Some(1), Some(255)])?;

    Ok(Options { strings, u8s })
}
