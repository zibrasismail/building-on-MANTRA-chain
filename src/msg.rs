use serde::{Deserialize, Serialize};
#[derive(Serialize, Deserialize)]
pub struct InstantiateMsg {
    pub message: String,
}