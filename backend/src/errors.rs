use candid::{CandidType, Deserialize};
use thiserror::Error;

#[derive(CandidType, Deserialize, Error, Debug, Clone)]
pub enum Error {
    #[error("User not found")]
    UserNotFound,
    #[error("Username already taken")]
    UsernameTaken,
    #[error("Invalid input: {0}")]
    InvalidInput(String),
    #[error("Unauthorized")]
    Unauthorized,
    #[error("Internal error: {0}")]
    InternalError(String),
}

impl From<std::string::FromUtf8Error> for Error {
    fn from(err: std::string::FromUtf8Error) -> Self {
        Error::InternalError(format!("UTF-8 error: {}", err))
    }
}

impl From<serde_json::Error> for Error {
    fn from(err: serde_json::Error) -> Self {
        Error::InternalError(format!("Serialization error: {}", err))
    }
}
