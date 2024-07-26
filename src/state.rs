use serde::{Deserialize, Serialize};
use cw_storage_plus::Item;

#[derive(Serialize, Deserialize)]
pub struct State {
    pub message: String,
}

pub const STATE: Item<State> = Item::new("state");