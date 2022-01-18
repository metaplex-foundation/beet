use std::fmt::Display;

use anyhow::Result;
use borsh::BorshSerialize;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Sample<T> {
    pub value: T,
    pub data: Vec<u8>,
}

impl<T> Sample<T> {
    pub fn new(value: T, data: Vec<u8>) -> Sample<T> {
        Sample { value, data }
    }
}

pub fn produce_samples<T>(xs: Vec<T>) -> Result<Vec<Sample<T>>>
where
    T: BorshSerialize,
{
    let samples: Vec<Sample<T>> = xs
        .into_iter()
        .filter_map(|x| match x.try_to_vec() {
            Ok(data) => Some(Sample::new(x, data)),
            Err(_) => None,
        })
        .collect();
    Ok(samples)
}

pub fn produce_stringified_samples<T>(xs: Vec<T>) -> Result<Vec<Sample<String>>>
where
    T: BorshSerialize + Display,
{
    let samples: Vec<Sample<String>> = xs
        .into_iter()
        .filter_map(|x| match x.try_to_vec() {
            Ok(data) => Some(Sample::new(x.to_string(), data)),
            Err(_) => None,
        })
        .collect();
    Ok(samples)
}
