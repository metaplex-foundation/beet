use anyhow::Result;

use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};

use crate::samples::{produce_samples, Sample};

#[derive(Serialize, Deserialize, BorshSerialize, BorshDeserialize)]
pub enum Direction {
    Up,
    Right,
    Down,
    Left,
}

#[derive(Serialize, Deserialize, BorshSerialize, BorshDeserialize)]
enum Milligrams {
    Grams = 1000,
    Kilograms = 1000_000,
}

#[derive(Serialize, Deserialize)]
pub struct Enums {
    directions: Vec<Sample<Direction>>,
    milligrams: Vec<Sample<Milligrams>>,
}

pub fn produce_enums() -> Result<Enums> {
    let directions: Vec<Sample<Direction>> = produce_samples(vec![Direction::Up, Direction::Down])?;
    let milligrams: Vec<Sample<Milligrams>> =
        produce_samples(vec![Milligrams::Grams, Milligrams::Kilograms])?;

    Ok(Enums {
        directions,
        milligrams,
    })
}
