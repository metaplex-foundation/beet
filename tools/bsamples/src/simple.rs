use anyhow::Result;
use borsh::BorshSerialize;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct Sample<T> {
    value: T,
    data: Vec<u8>,
}

fn produce_samples<T>(xs: Vec<T>) -> Result<Vec<Sample<T>>>
where
    T: BorshSerialize,
{
    let samples: Vec<Sample<T>> = xs
        .into_iter()
        .filter_map(|x| match x.try_to_vec() {
            Ok(data) => Some(Sample { value: x, data }),
            Err(_) => None,
        })
        .collect();
    Ok(samples)
}

#[derive(Serialize, Deserialize)]
pub struct Simple {
    strings: Vec<Sample<String>>,
}

pub fn produce_simple() -> Result<Simple> {
    let xs: Vec<String> = vec!["", "Bob", "Harry and Bob"]
        .into_iter()
        .map(|x| x.to_string())
        .collect();
    let strings = produce_samples(xs)?;

    Ok(Simple { strings })
}
