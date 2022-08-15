use anyhow::Result;

use serde::{Deserialize, Serialize};

use crate::samples::{produce_samples, Sample};

#[derive(Serialize, Deserialize)]
pub struct Tuples {
    // Fixed Size top level
    u8_u8s: Vec<Sample<(u8, u8)>>,
    u8_i16_u32s: Vec<Sample<(u8, i16, u32)>>,

    // Fixable top level
    u8_strings: Vec<Sample<(u8, String)>>,
    string_u16s: Vec<Sample<(String, u16)>>,
    u8_vec_i32s_i8: Vec<Sample<(u8, Vec<i32>, i8)>>,

    // Nested Fixed and Fixable
    vec_u8_u8s: Vec<Sample<Vec<(u8, u8)>>>,
    vec_u8_strings: Vec<Sample<Vec<(u8, String)>>>,
}

pub fn produce_tuples() -> Result<Tuples> {
    let u8_u8s = produce_samples(vec![(1, 1), (1, 2), (3, 3)])?;
    let u8_i16_u32s = produce_samples(vec![(1, 2, 3), (9, -9, 22), (0, -5, 0)])?;
    let u8_strings = produce_samples(vec![
        (1, "1".to_string()),
        (2, "22".to_string()),
        (3, "333".to_string()),
    ])?;
    let string_u16s = produce_samples(vec![
        ("hello world".to_string(), 100),
        ("hola mundo".to_string(), 200),
    ])?;
    let u8_vec_i32s_i8 = produce_samples(vec![
        (1, vec![1, 2, 3, 4], 11),
        (2, vec![-4, -3, -2, -1, 0, 1, 2, 3, 4], 22),
        (3, vec![-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 33),
    ])?;

    let vec_u8_u8s = produce_samples(vec![
        vec![(1, 1), (2, 2), (3, 3)],
        vec![(1, 2), (3, 4), (5, 6)],
    ])?;

    let vec_u8_strings = produce_samples(vec![
        vec![
            (1, "1".to_string()),
            (2, "2".to_string()),
            (3, "3".to_string()),
        ],
        vec![
            (1, "22".to_string()),
            (3, "444".to_string()),
            (5, "6666".to_string()),
        ],
    ])?;

    Ok(Tuples {
        u8_u8s,
        u8_i16_u32s,
        u8_strings,
        string_u16s,
        u8_vec_i32s_i8,
        vec_u8_u8s,
        vec_u8_strings,
    })
}
