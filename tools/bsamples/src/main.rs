use std::{fs::File, io::Write};

use anyhow::Result;
use borsh::BorshDeserialize;
use composites::produce_composites;
use data_enums::produce_data_enums;
use enums::produce_enums;
use maps::produce_maps;
use options::produce_options;
use sets::produce_sets;
use simple::produce_simple;
use tuples::produce_tuples;
use vecs::produce_vecs;

mod composites;
mod data_enums;
mod enums;
mod maps;
mod options;
mod samples;
mod sets;
mod simple;
mod tuples;
mod vecs;

#[allow(unused)]
fn try_from_slice_unchecked<T: BorshDeserialize>(data: &[u8]) -> Result<T> {
    let mut data_mut = data;
    let result = T::deserialize(&mut data_mut)?;
    Ok(result)
}

fn main() -> Result<()> {
    // NOTE: needs to be run from ./tools/bsamples
    let data_dir = "../../beet/test/compat/fixtures";

    {
        let simple_json = serde_json::to_string_pretty(&produce_simple()?)?;
        let mut simple_file = File::create(format!("{}/simple.json", data_dir))?;
        simple_file.write_all(simple_json.as_bytes())?;
    }

    {
        let options_json = serde_json::to_string_pretty(&produce_options()?)?;
        let mut options_file = File::create(format!("{}/options.json", data_dir))?;
        options_file.write_all(options_json.as_bytes())?;
    }

    {
        let enums_json = serde_json::to_string_pretty(&produce_enums()?)?;
        let mut enums_file = File::create(format!("{}/enums.json", data_dir))?;
        enums_file.write_all(enums_json.as_bytes())?;
    }

    {
        let data_enums_json = serde_json::to_string_pretty(&produce_data_enums()?)?;
        let mut data_enums_file = File::create(format!("{}/data_enums.json", data_dir))?;
        data_enums_file.write_all(data_enums_json.as_bytes())?;
    }

    {
        let vecs_json = serde_json::to_string_pretty(&produce_vecs()?)?;
        let mut vecs_file = File::create(format!("{}/vecs.json", data_dir))?;
        vecs_file.write_all(vecs_json.as_bytes())?;
    }

    {
        let composites_json = serde_json::to_string_pretty(&produce_composites()?)?;
        let mut composites_file = File::create(format!("{}/composites.json", data_dir))?;
        composites_file.write_all(composites_json.as_bytes())?;
    }

    {
        let tuples_json = serde_json::to_string_pretty(&produce_tuples()?)?;
        let mut top_level_tuples_file = File::create(format!("{}/tuples.json", data_dir))?;
        top_level_tuples_file.write_all(tuples_json.as_bytes())?;
    }

    {
        let maps_json = serde_json::to_string_pretty(&produce_maps()?)?;
        let mut top_level_maps_file = File::create(format!("{}/maps.json", data_dir))?;
        top_level_maps_file.write_all(maps_json.as_bytes())?;
    }

    {
        let sets_json = serde_json::to_string_pretty(&produce_sets()?)?;
        let mut top_level_sets_file = File::create(format!("{}/sets.json", data_dir))?;
        top_level_sets_file.write_all(sets_json.as_bytes())?;
    }
    Ok(())
}
