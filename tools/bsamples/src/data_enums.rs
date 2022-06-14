use anyhow::Result;

use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};

use crate::samples::{produce_samples, Sample};
#[derive(Serialize, Deserialize, BorshSerialize, BorshDeserialize)]
pub enum Simple {
    First { first_field: u32 },
    Second { second_field: u32 },
}

#[derive(Serialize, Deserialize, BorshSerialize, BorshDeserialize)]
pub enum CollectionInfo {
    V1 {
        symbol: String,
        verified_creators: Vec<u8>,
        whitelist_root: [u8; 32],
    },
    V2 {
        collection_mint: u8,
    },
}

#[derive(Serialize, Deserialize)]
pub struct DataEnums {
    collections: Vec<Sample<CollectionInfo>>,
    simples: Vec<Sample<Simple>>,
}

pub fn produce_data_enums() -> Result<DataEnums> {
    let collections: Vec<Sample<CollectionInfo>> = produce_samples(vec![
        CollectionInfo::V1 {
            symbol: "TEST".to_string(),
            verified_creators: vec![1, 2, 3],
            whitelist_root: [0; 32],
        },
        CollectionInfo::V2 { collection_mint: 4 },
    ])?;
    let simples = produce_samples(vec![
        Simple::First { first_field: 11 },
        Simple::Second { second_field: 22 },
    ])?;

    Ok(DataEnums {
        simples,
        collections,
    })
}
