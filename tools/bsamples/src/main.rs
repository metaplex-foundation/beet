use std::{fs::File, io::Write};

use anyhow::Result;
use borsh::BorshDeserialize;
use options::produce_options;
use simple::produce_simple;
use vecs::produce_vecs;

mod options;
mod samples;
mod simple;
mod vecs;

fn try_from_slice_unchecked<T: BorshDeserialize>(data: &[u8]) -> Result<T> {
    let mut data_mut = data;
    let result = T::deserialize(&mut data_mut)?;
    Ok(result)
}

fn main() -> Result<()> {
    // TODO(thlorenz): Parse from args
    let data_dir = "../../beet/test/compat/fixtures";

    let simple_json = serde_json::to_string_pretty(&produce_simple()?)?;
    let mut simple_file = File::create(format!("{}/simple.json", data_dir))?;
    simple_file.write_all(simple_json.as_bytes())?;

    let options_json = serde_json::to_string_pretty(&produce_options()?)?;
    let mut options_file = File::create(format!("{}/options.json", data_dir))?;
    options_file.write_all(options_json.as_bytes())?;

    let vecs_json = serde_json::to_string_pretty(&produce_vecs()?)?;
    let mut vecs_file = File::create(format!("{}/vecs.json", data_dir))?;
    vecs_file.write_all(vecs_json.as_bytes())?;

    Ok(())
}
