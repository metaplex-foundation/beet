use anyhow::Result;

use serde::{Deserialize, Serialize};

use crate::samples::{produce_samples, Sample};

#[derive(Serialize, Deserialize)]
pub struct FixedSizeTopLevelTuples {
    u8_u8s: Vec<Sample<(u8, u8)>>,
    u8_i16_u32s: Vec<Sample<(u8, i16, u32)>>,
}

pub fn produce_fixed_size_top_level_tuples() -> Result<FixedSizeTopLevelTuples> {
    let u8_u8s = produce_samples(vec![(1, 1), (1, 2), (3, 3)])?;
    let u8_i16_u32s = produce_samples(vec![(1, 2, 3), (9, -9, 22), (0, -5, 0)])?;

    Ok(FixedSizeTopLevelTuples {
        u8_u8s,
        u8_i16_u32s,
    })
}
