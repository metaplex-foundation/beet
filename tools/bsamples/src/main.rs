use anyhow::Result;
use borsh::{BorshDeserialize, BorshSerialize};
use simple::produce_simple;
mod samples;
mod simple;

fn try_from_slice_unchecked<T: BorshDeserialize>(data: &[u8]) -> Result<T> {
    let mut data_mut = data;
    let result = T::deserialize(&mut data_mut)?;
    Ok(result)
}

fn main() -> Result<()> {
    let simple = produce_simple()?;
    let simple_json = serde_json::to_string_pretty(&simple)?;
    print!("{}", simple_json);
    Ok(())
}
