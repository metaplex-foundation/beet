use anyhow::Result;

use serde::{Deserialize, Serialize};

use crate::samples::{produce_samples, Sample};

#[derive(Serialize, Deserialize)]
pub struct Composites {
    vec_opt_u8s: Vec<Sample<Vec<Option<u8>>>>,
    opt_vec_u8s: Vec<Sample<Option<Vec<u8>>>>,
}

pub fn produce_composites() -> Result<Composites> {
    let vec_opt_u8s = produce_samples(vec![vec![], vec![None], vec![None, Some(5), Some(7)]])?;
    let opt_vec_u8s = produce_samples(vec![Some(vec![]), None, Some(vec![5, 7])])?;

    Ok(Composites {
        vec_opt_u8s,
        opt_vec_u8s,
    })
}
