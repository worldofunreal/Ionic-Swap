use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
};
use tokio::sync::RwLock;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::EnvFilter;

// ponytail: minimal off-chain Rust — single file, no DB, no chain.
// Precios: cada navegador trae su Binance gratis y el servidor agrega la
// mediana. Sin reportes frescos no hay swap: se rechaza, no se inventa.
// ---------- Fase A: economia real en servidor ----------
const FAUCET_USDT: f64 = 2_000_000.0;
const MAX_NOTIONAL_USDT: f64 = 250_000.0;
const STALE_AFTER_SECS: i64 = 900;
const REPORT_WINDOW: usize = 30;
const REPORT_DEVIATION: f64 = 0.25;
const FEE_RATE: f64 = 0.003; // Stage-1 legacy: base 0.3%
const HISTORY_CAP: usize = 500;
const TRADE_KEY_MIN: usize = 8;
const TRADE_KEY_MAX: usize = 64;

// symbol, decimales de display (tabla legacy TokenService), interno=precio propio
const TOKENS: &[(&str, u32, bool)] = &[
    ("USDT", 2, true),
    ("BTC", 6, false),
    ("ETH", 6, false),
    ("SOL", 2, false),
    ("ICP", 2, false),
    ("XRP", 2, false),
    ("BNB", 4, false),
    ("DOGE", 2, false),
    ("ADA", 2, false),
    ("TRX", 2, false),
    ("IONIC", 2, true),
    ("UNREAL", 2, true),
    ("SPIRAL", 2, true),
];
// Semilla de arranque (nace stale a proposito: solo reportes frescos operan).
const ORACLE_SEED: &[(&str, f64)] = &[
    ("BTC", 58451.25),
    ("ETH", 3120.4),
    ("SOL", 142.25),
    ("ICP", 8.91),
    ("XRP", 0.62),
    ("BNB", 605.12),
    ("DOGE", 0.14),
    ("ADA", 0.45),
    ("TRX", 0.11),
];

#[derive(Clone, Serialize, Deserialize)]
struct Price { symbol: String, price: f64, change_24h: f64, ts: i64, stale: bool }

#[derive(Clone, Serialize, Deserialize)]
struct BookEntry { price: f64, ts: i64, change_24h: f64, internal: bool }

fn default_tx_kind() -> String {
    "swap".to_string()
}

#[derive(Clone, Serialize, Deserialize)]
struct SwapTx {
    id: String, key: String, from: String, to: String,
    amount: f64, receive: f64, price_from: f64, price_to: f64,
    fee_usd: f64, ts: i64,
    #[serde(default = "default_tx_kind")]
    kind: String, // swap | transfer
}

// Todo el estado trade vive aqui y se guarda en STATE_PATH (el ledger SPIRAL
// no se toca: ya esta probado con el puente).
#[derive(Clone, Serialize, Deserialize, Default)]
struct TradeState {
    book: HashMap<String, BookEntry>,
    reports: HashMap<String, Vec<(i64, f64)>>,
    day_open: HashMap<String, (i64, f64)>,
    balances: HashMap<String, HashMap<String, f64>>,
    faucet_claims: HashSet<String>,
    txs: HashMap<String, Vec<SwapTx>>,
    processed: HashMap<String, serde_json::Value>,
    volume_usd: HashMap<String, f64>,
    fees_usd: HashMap<String, f64>,
    // Fase B (con default: abre state.json viejos sin romper)
    #[serde(default)]
    positions: HashMap<String, Position>,
    #[serde(default)]
    fee_index: HashMap<String, f64>,
    #[serde(default)]
    liq_txs: HashMap<String, Vec<LiqTx>>,
    #[serde(default)]
    fee_events: Vec<(i64, String, f64)>,
}

fn token_cfg(sym: &str) -> Option<(&'static str, u32, bool)> {
    TOKENS.iter().find(|(t, _, _)| *t == sym).copied()
}

fn round_dp(v: f64, dp: u32) -> f64 {
    let m = 10f64.powi(dp as i32);
    (v * m).round() / m + 0.0 // +0.0: -0.0 se ve feo en JSON
}

fn median(mut v: Vec<f64>) -> f64 {
    if v.is_empty() {
        return 0.0;
    }
    v.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let n = v.len();
    if n % 2 == 1 {
        v[n / 2]
    } else {
        (v[n / 2 - 1] + v[n / 2]) / 2.0
    }
}

fn save_trade(path: &str, st: &TradeState) {
    if let Ok(json) = serde_json::to_string(st) {
        let tmp = format!("{path}.tmp");
        if std::fs::write(&tmp, json).is_ok() {
            let _ = std::fs::rename(&tmp, path);
        }
    }
}

fn seed_trade() -> TradeState {
    let now = Utc::now().timestamp();
    let mut st = TradeState::default();
    for sym in ["USDT", "IONIC", "UNREAL", "SPIRAL"] {
        st.book.insert(sym.to_string(), BookEntry { price: 1.0, ts: now, change_24h: 0.0, internal: true });
    }
    for (sym, price) in ORACLE_SEED {
        st.book.insert(sym.to_string(), BookEntry {
            price: *price, ts: now - STALE_AFTER_SECS - 1, change_24h: 0.0, internal: false,
        });
    }
    st
}

#[derive(Clone, Serialize, Deserialize)]
struct StakeReq { token: String, amount: f64, dissolve_delay_secs: u64 }

#[derive(Clone, Serialize, Deserialize)]
struct StakeResp { position_id: String, token: String, amount: f64, voting_power: f64, apy: f64 }

// ---------- Fase B: staking con neuronas (spec MVP/Stage-1 legacy) ----------
// Semilla de arranque (paridad legacy, sin dueno): profundidad inicial de
// display. NO diluye fees: el indice solo reparte entre posiciones de usuarios.
const SEED_STAKE: &[(&str, f64)] = &[
    ("IONIC", 125000.0),
    ("UNREAL", 12000.0),
    ("BTC", 2.10),
    ("SOL", 840.0),
    ("XRP", 45000.0),
];
const STAKE_MIN_DELAY_SECS: u64 = 86400;
const STAKE_MAX_DELAY_SECS: u64 = 126144000; // 4y (tope del slider UI)
const STAKE_MAX_VALUE_USDT: f64 = 1_000_000.0;
const FEE_EVENTS_CAP: usize = 5000;
const APY_WINDOW_SECS: i64 = 30 * 86400;

#[derive(Clone, Serialize, Deserialize)]
struct Position {
    id: String, sub: String, token: String,
    amount: f64, delay_secs: u64, created_at: i64,
    state: String, // Locked | Dissolving | Dissolved
    dissolving_started_at: Option<i64>,
    withdrawn: f64, last_index: f64,
}

#[derive(Clone, Serialize, Deserialize)]
struct LiqTx {
    id: String, kind: String, position_id: Option<String>,
    token: String, amount: f64, ts: i64,
}

fn delay_mult(delay_secs: u64) -> f64 {
    let d = delay_secs as f64 / 86400.0;
    if d <= 1.0 { 1.0 } else if d <= 7.0 { 1.5 } else if d <= 30.0 { 2.0 } else if d <= 90.0 { 3.0 } else { 5.0 }
}

fn age_mult(age_days: f64, dissolving: bool) -> f64 {
    if dissolving {
        return 1.0;
    }
    if age_days < 30.0 { 1.0 } else if age_days < 90.0 { 1.1 } else if age_days < 180.0 { 1.2 } else if age_days < 365.0 { 1.3 } else { 1.5 }
}

fn dissolve_fraction(p: &Position, now: i64) -> f64 {
    match p.dissolving_started_at {
        Some(t0) if p.delay_secs > 0 => ((now - t0).max(0) as f64 / p.delay_secs as f64).min(1.0),
        _ => 0.0,
    }
}

// Poder de voto: solo la tranche bloqueada gana (disolviendo gana menos con el tiempo).
fn voting_power(p: &Position, now: i64) -> f64 {
    if p.state == "Dissolved" {
        return 0.0;
    }
    let dissolving = p.state == "Dissolving";
    let locked = if dissolving { p.amount * (1.0 - dissolve_fraction(p, now)) } else { p.amount };
    if locked <= 0.0 {
        return 0.0;
    }
    let age_days = if dissolving { 0.0 } else { (now - p.created_at).max(0) as f64 / 86400.0 };
    locked * delay_mult(p.delay_secs) * age_mult(age_days, dissolving)
}

fn available_now(p: &Position, now: i64) -> f64 {
    if p.state == "Dissolved" {
        return (p.amount - p.withdrawn).max(0.0);
    }
    if p.state != "Dissolving" {
        return 0.0;
    }
    (p.amount * dissolve_fraction(p, now) - p.withdrawn).max(0.0)
}

fn claimable(p: &Position, index_now: f64, now: i64) -> f64 {
    let c = voting_power(p, now) * (index_now - p.last_index);
    if c > 0.0 { c } else { 0.0 }
}

fn accrue_fee(st: &mut TradeState, token: &str, fee_usd: f64, now: i64) {
    if fee_usd <= 0.0 {
        return;
    }
    let w: f64 = st.positions.values().filter(|p| p.token == token).map(|p| voting_power(p, now)).sum();
    if w > 0.0 {
        *st.fee_index.entry(token.to_string()).or_insert(0.0) += fee_usd / w;
    }
    st.fee_events.push((now, token.to_string(), fee_usd));
    if st.fee_events.len() > FEE_EVENTS_CAP {
        st.fee_events.drain(..st.fee_events.len() - FEE_EVENTS_CAP);
    }
}

fn position_view(st: &TradeState, p: &Position, now: i64) -> serde_json::Value {
    let idx = st.fee_index.get(&p.token).copied().unwrap_or(0.0);
    serde_json::json!({
        "id": p.id, "token": p.token, "amount": p.amount, "state": p.state,
        "delay_secs": p.delay_secs, "created_at": p.created_at,
        "dissolving_started_at": p.dissolving_started_at, "withdrawn": round_dp(p.withdrawn, 6),
        "available_now": round_dp(available_now(p, now), 6),
        "voting_power": round_dp(voting_power(p, now), 2),
        "claimable_usdt": round_dp(claimable(p, idx, now), 2),
        "global_index": idx, "last_index": p.last_index,
    })
}

fn liq_log(st: &mut TradeState, sub: &str, kind: &str, pid: Option<String>, token: &str, amount: f64, now: i64) {
    let e = st.liq_txs.entry(sub.to_string()).or_default();
    e.push(LiqTx { id: uuid::Uuid::new_v4().to_string(), kind: kind.to_string(), position_id: pid, token: token.to_string(), amount, ts: now });
    if e.len() > HISTORY_CAP {
        e.drain(..e.len() - HISTORY_CAP);
    }
}

#[derive(Clone)]
struct AppState {
    // libro de precios agregado de reportes de navegadores (Fase A)
    trade: Arc<RwLock<TradeState>>,
    state_path: String,
    // SPIRAL ledger (fase Rush): saldos por wou-id account_id + idempotencia.
    ledger: Arc<RwLock<Ledger>>,
    ledger_path: String,
    jwt_secret: String,
    bridge_url: String,
    bridge_secret: String,
}

// ---------- SPIRAL ledger ----------
// Saldos por jugador (wou-id account_id). Sin cadena: la verdad vive aqui.
const FAUCET_AMOUNT: f64 = 1000.0;
const FAUCET_TOPUP_BELOW: f64 = 100.0;
const MIN_BET: f64 = 10.0;
const MAX_BET: f64 = 1000.0;

#[derive(Clone, Serialize, Deserialize, Default)]
struct Ledger {
    balances: HashMap<String, f64>,
    // idempotency-key -> respuesta ya entregada (reintentos seguros)
    processed: HashMap<String, serde_json::Value>,
}

#[derive(Deserialize)]
struct Claims {
    sub: String,
    #[allow(dead_code)]
    exp: u64,
}

#[derive(Deserialize)]
struct AmountReq {
    amount: f64,
    key: String,
}

fn round2(v: f64) -> f64 {
    (v * 100.0).round() / 100.0
}

fn auth_sub(headers: &HeaderMap, secret: &str) -> Result<String, StatusCode> {
    let h = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    let tok = h.strip_prefix("Bearer ").unwrap_or("");
    if tok.is_empty() || secret.is_empty() {
        return Err(StatusCode::UNAUTHORIZED);
    }
    let mut validation = jsonwebtoken::Validation::new(jsonwebtoken::Algorithm::HS256);
    validation.validate_exp = true;
    jsonwebtoken::decode::<Claims>(
        tok,
        &jsonwebtoken::DecodingKey::from_secret(secret.as_bytes()),
        &validation,
    )
    .map(|d| d.claims.sub)
    .map_err(|_| StatusCode::UNAUTHORIZED)
}

fn save_ledger(path: &str, ledger: &Ledger) {
    if let Ok(json) = serde_json::to_string(ledger) {
        let _ = std::fs::write(path, json);
    }
}

async fn ledger_balance(
    State(s): State<AppState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    let ledger = s.ledger.read().await;
    let balance = round2(*ledger.balances.get(&sub).unwrap_or(&0.0));
    (StatusCode::OK, Json(serde_json::json!({"balance": balance}))).into_response()
}

async fn ledger_faucet(
    State(s): State<AppState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    let mut ledger = s.ledger.write().await;
    let balance = ledger.balances.entry(sub).or_insert(0.0);
    let granted = if *balance < FAUCET_TOPUP_BELOW {
        *balance = round2(*balance + FAUCET_AMOUNT);
        true
    } else {
        false
    };
    let resp = serde_json::json!({"balance": round2(*balance), "granted": granted});
    save_ledger(&s.ledger_path, &ledger);
    (StatusCode::OK, Json(resp)).into_response()
}

async fn ledger_debit(
    State(s): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<AmountReq>,
) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    if !(MIN_BET..=MAX_BET).contains(&req.amount) || req.key.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error":"monto invalido (10-1000) o key vacia"})),
        )
            .into_response();
    }
    let mut ledger = s.ledger.write().await;
    if let Some(prev) = ledger.processed.get(&req.key) {
        let mut replay = prev.clone();
        replay["replay"] = serde_json::json!(true);
        return (StatusCode::OK, Json(replay)).into_response();
    }
    let balance = ledger.balances.entry(sub).or_insert(0.0);
    if *balance < req.amount {
        return (
            StatusCode::PAYMENT_REQUIRED,
            Json(serde_json::json!({"error":"saldo insuficiente", "balance": round2(*balance)})),
        )
            .into_response();
    }
    *balance = round2(*balance - req.amount);
    let resp = serde_json::json!({"balance": round2(*balance), "debit_id": req.key});
    ledger.processed.insert(req.key.clone(), resp.clone());
    save_ledger(&s.ledger_path, &ledger);
    (StatusCode::OK, Json(resp)).into_response()
}

async fn ledger_credit(
    State(s): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<AmountReq>,
) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    if req.amount < 0.0 || req.amount > 10_000_000.0 || req.key.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error":"monto o key invalidos"})),
        )
            .into_response();
    }
    let mut ledger = s.ledger.write().await;
    if let Some(prev) = ledger.processed.get(&req.key) {
        let mut replay = prev.clone();
        replay["replay"] = serde_json::json!(true);
        return (StatusCode::OK, Json(replay)).into_response();
    }
    let balance = ledger.balances.entry(sub).or_insert(0.0);
    *balance = round2(*balance + req.amount);
    let resp = serde_json::json!({"balance": round2(*balance)});
    ledger.processed.insert(req.key.clone(), resp.clone());
    save_ledger(&s.ledger_path, &ledger);
    (StatusCode::OK, Json(resp)).into_response()
}

async fn health() -> impl IntoResponse { Json(serde_json::json!({"status":"ok","service":"ionicswap-server","chain":"freebsd-native","oracle":"client-reported median (browser binance)"})) }

// ---------- SPIRAL BRIDGE — wallet Ionic <-> bolsillo de juego wou-id ----------
// La misma llave idempotente gobierna ambos lados: un reintento replayea en
// wou-id (devuelve el balance ya aplicado) y en el ledger local (processed),
// asi ningún colgado puede mover dinero dos veces. Montos enteros SPIRAL.

#[derive(Deserialize)]
struct BridgeReq { amount: u64, key: String }

async fn bridge_call(
    s: &AppState,
    dir: &str,
    sub: &str,
    amount: u64,
    key: &str,
) -> Result<u64, (StatusCode, serde_json::Value)> {
    if s.bridge_secret.is_empty() {
        return Err((StatusCode::SERVICE_UNAVAILABLE, serde_json::json!({"error": "bridge no configurado"})));
    }
    let url = format!("{}/api/v1/internal/spiral/bridge", s.bridge_url.trim_end_matches('/'));
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, serde_json::json!({"error": e.to_string()})))?;
    let resp = client
        .post(&url)
        .bearer_auth(&s.bridge_secret)
        .json(&serde_json::json!({"account": sub, "amount": amount, "dir": dir, "key": key}))
        .send()
        .await
        .map_err(|e| (StatusCode::BAD_GATEWAY, serde_json::json!({"error": format!("wou-id inaccesible: {e}")})))?;
    let status = resp.status();
    let body: serde_json::Value = resp.json().await.unwrap_or_default();
    if status == reqwest::StatusCode::OK {
        body.get("balance")
            .and_then(|b| b.as_u64())
            .ok_or_else(|| (StatusCode::BAD_GATEWAY, serde_json::json!({"error": "respuesta wou-id sin balance"})))
    } else if status == reqwest::StatusCode::PAYMENT_REQUIRED {
        Err((StatusCode::PAYMENT_REQUIRED, serde_json::json!({"error": "bolsillo de juego insuficiente"})))
    } else {
        Err((StatusCode::BAD_GATEWAY, body))
    }
}

fn bridge_key(dir_prefix: &str, sub: &str, req_key: &str) -> String {
    format!("{}:{}:{}", dir_prefix, &sub[..sub.len().min(8)], req_key)
}

async fn spiral_deposit(
    State(s): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<BridgeReq>,
) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    if req.amount == 0 || req.amount > 1_000_000 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"amount debe ser 1..1000000"}))).into_response();
    }
    if req.key.len() < 8 || req.key.len() > 64 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"key debe tener 8..64 chars"}))).into_response();
    }
    let bkey = bridge_key("dep", &sub, &req.key);
    // El lock de escritura cubre todo el movimiento: nadie te toca el saldo a la vez.
    let mut ledger = s.ledger.write().await;
    if let Some(prev) = ledger.processed.get(&bkey) {
        let mut replay = prev.clone();
        replay["replay"] = serde_json::json!(true);
        return (StatusCode::OK, Json(replay)).into_response();
    }
    let wallet = ledger.balances.get(&sub).copied().unwrap_or(0.0);
    if wallet < req.amount as f64 {
        return (
            StatusCode::PAYMENT_REQUIRED,
            Json(serde_json::json!({"error":"saldo de wallet insuficiente", "wallet": round2(wallet)})),
        )
            .into_response();
    }
    let pocket = match bridge_call(&s, "credit", &sub, req.amount, &bkey).await {
        Ok(p) => p,
        Err((code, body)) => return (code, Json(body)).into_response(),
    };
    let wallet_next = round2(wallet - req.amount as f64);
    ledger.balances.insert(sub.clone(), wallet_next);
    let resp = serde_json::json!({"wallet": wallet_next, "pocket": pocket, "key": bkey});
    ledger.processed.insert(bkey, resp.clone());
    save_ledger(&s.ledger_path, &ledger);
    (StatusCode::OK, Json(resp)).into_response()
}

async fn spiral_withdraw(
    State(s): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<BridgeReq>,
) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    if req.amount == 0 || req.amount > 1_000_000 || req.key.len() < 8 || req.key.len() > 64 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"amount 1..1000000, key 8..64"}))).into_response();
    }
    let bkey = bridge_key("wd", &sub, &req.key);
    if let Some(prev) = ledger_processed_read(&s, &bkey).await {
        let mut replay = prev.clone();
        replay["replay"] = serde_json::json!(true);
        return (StatusCode::OK, Json(replay)).into_response();
    }
    // Primero vacia el bolsillo (wou-id manda el no); si pasamos de ahi,
    // creditar el wallet local es infalible. Un colgado a mitad replayea
    // el mismo bkey en wou-id sin debitar dos veces.
    let pocket = match bridge_call(&s, "debit", &sub, req.amount, &bkey).await {
        Ok(p) => p,
        Err((code, body)) => return (code, Json(body)).into_response(),
    };
    let mut ledger = s.ledger.write().await;
    if ledger.processed.contains_key(&bkey) {
        let mut replay = ledger.processed[&bkey].clone();
        replay["replay"] = serde_json::json!(true);
        return (StatusCode::OK, Json(replay)).into_response();
    }
    let wallet = ledger.balances.entry(sub.clone()).or_insert(0.0);
    *wallet = round2(*wallet + req.amount as f64);
    let resp = serde_json::json!({"wallet": *wallet, "pocket": pocket, "key": bkey});
    ledger.processed.insert(bkey, resp.clone());
    save_ledger(&s.ledger_path, &ledger);
    (StatusCode::OK, Json(resp)).into_response()
}

async fn ledger_processed_read(s: &AppState, key: &str) -> Option<serde_json::Value> {
    s.ledger.read().await.processed.get(key).cloned()
}

fn book_price(st: &TradeState, sym: &str, now: i64) -> Option<(f64, f64, i64, bool)> {
    st.book.get(sym).map(|e| {
        let stale = !e.internal && now - e.ts > STALE_AFTER_SECS;
        (e.price, e.change_24h, e.ts, stale)
    })
}

async fn get_prices(State(s): State<AppState>) -> impl IntoResponse {
    let st = s.trade.read().await;
    let now = Utc::now().timestamp();
    let mut v: Vec<Price> = TOKENS
        .iter()
        .map(|(t, _, _)| {
            let (price, change_24h, ts, stale) = book_price(&st, t, now).unwrap_or((0.0, 0.0, 0, true));
            Price { symbol: t.to_string(), price, change_24h, ts, stale }
        })
        .collect();
    v.sort_by(|a, b| a.symbol.cmp(&b.symbol));
    Json(v)
}

async fn get_price(Path(sym): Path<String>, State(s): State<AppState>) -> impl IntoResponse {
    let sym = sym.to_uppercase();
    if token_cfg(&sym).is_none() {
        return (StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"unknown token"}))).into_response();
    }
    let st = s.trade.read().await;
    let now = Utc::now().timestamp();
    let (price, change_24h, ts, stale) = book_price(&st, &sym, now).unwrap_or((0.0, 0.0, 0, true));
    (StatusCode::OK, Json(serde_json::to_value(Price { symbol: sym, price, change_24h, ts, stale }).unwrap())).into_response()
}

async fn get_tokens(State(s): State<AppState>) -> impl IntoResponse {
    let st = s.trade.read().await;
    let now = Utc::now().timestamp();
    let mut v: Vec<serde_json::Value> = TOKENS
        .iter()
        .map(|(t, dp, internal)| {
            let (price, change_24h, ts, stale) = book_price(&st, t, now).unwrap_or((0.0, 0.0, 0, true));
            serde_json::json!({
                "symbol": t, "display_decimals": dp, "internal": internal,
                "price": price, "change_24h": change_24h, "ts": ts, "stale": stale,
            })
        })
        .collect();
    v.sort_by(|a, b| a["symbol"].as_str().cmp(&b["symbol"].as_str()));
    Json(v)
}

#[derive(Deserialize)]
struct ReportObs { symbol: String, price: f64 }

#[derive(Deserialize)]
struct ReportReq { observations: Vec<ReportObs> }

// Cada navegador trae su Binance gratis; el servidor agrega la mediana.
// Reportes absurdos (>25% de la mediana) se ignoran sin romper nada.
async fn report_prices(
    State(s): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<ReportReq>,
) -> impl IntoResponse {
    if auth_sub(&headers, &s.jwt_secret).is_err() {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error":"unauthorized"}))).into_response();
    }
    let now = Utc::now().timestamp();
    let mut st = s.trade.write().await;
    let (mut accepted, mut ignored) = (0, 0);
    for o in req.observations.iter().take(32) {
        let sym = o.symbol.to_uppercase();
        match token_cfg(&sym) {
            Some((_, _, false)) => {}
            _ => { ignored += 1; continue; }
        }
        if !o.price.is_finite() || o.price <= 0.0 {
            ignored += 1;
            continue;
        }
        if let Some(e) = st.book.get(&sym) {
            if e.price > 0.0 && ((o.price - e.price).abs() / e.price) > REPORT_DEVIATION {
                ignored += 1;
                continue;
            }
        }
        let rep = st.reports.entry(sym.clone()).or_default();
        rep.push((now, o.price));
        if rep.len() > REPORT_WINDOW {
            rep.drain(..rep.len() - REPORT_WINDOW);
        }
        let med = median(rep.iter().map(|(_, p)| *p).collect());
        let day = now / 86400;
        let open = match st.day_open.get(&sym) {
            Some((d, p)) if *d == day => *p,
            _ => { st.day_open.insert(sym.clone(), (day, med)); med }
        };
        let chg = if open > 0.0 { (med - open) / open * 100.0 } else { 0.0 };
        st.book.insert(sym, BookEntry { price: med, ts: now, change_24h: chg, internal: false });
        accepted += 1;
    }
    save_trade(&s.state_path, &st);
    (StatusCode::OK, Json(serde_json::json!({"accepted": accepted, "ignored": ignored}))).into_response()
}

// Faucet demo: 2M USDT por unica vez por cuenta (paridad legacy).
async fn trade_faucet(State(s): State<AppState>, headers: HeaderMap) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    let mut st = s.trade.write().await;
    let granted = if st.faucet_claims.contains(&sub) {
        false
    } else {
        st.faucet_claims.insert(sub.clone());
        let b = st.balances.entry(sub.clone()).or_default();
        let cur = b.get("USDT").copied().unwrap_or(0.0);
        b.insert("USDT".to_string(), round_dp(cur + FAUCET_USDT, 2));
        true
    };
    let balance = round_dp(st.balances.get(&sub).and_then(|b| b.get("USDT")).copied().unwrap_or(0.0), 2);
    save_trade(&s.state_path, &st);
    (StatusCode::OK, Json(serde_json::json!({"balance": balance, "granted": granted}))).into_response()
}

async fn trade_balances(State(s): State<AppState>, headers: HeaderMap) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    let st = s.trade.read().await;
    let now = Utc::now().timestamp();
    let mut out = serde_json::Map::new();
    let mut total = 0.0;
    if let Some(b) = st.balances.get(&sub) {
        for (tok, amt) in b {
            if *amt <= 0.0 {
                continue;
            }
            let price = st.book.get(tok).map(|e| e.price).unwrap_or(0.0);
            total += amt * price;
            out.insert(tok.clone(), serde_json::json!(*amt));
        }
    }
    // Fase D: SPIRAL se lee de su ledger (verdad unica), no se duplica aqui.
    let spiral = s.ledger.read().await.balances.get(&sub).copied().unwrap_or(0.0);
    if spiral > 0.0 {
        let price = st.book.get("SPIRAL").map(|e| e.price).unwrap_or(1.0);
        total += spiral * price;
        out.insert("SPIRAL".to_string(), serde_json::json!(spiral));
    }
    (StatusCode::OK, Json(serde_json::json!({"balances": out, "total_usdt": round_dp(total, 2), "ts": now}))).into_response()
}

#[derive(Deserialize)]
struct TradeSwapReq { from: String, to: String, amount: f64, key: String }

// Swap real: descuenta y acredita saldos, cobra 0.3%, guarda historial.
// Sin precio fresco no opera (503 honesto en vez de numero inventado).
async fn trade_swap(State(s): State<AppState>, headers: HeaderMap, Json(req): Json<TradeSwapReq>) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    if req.key.len() < TRADE_KEY_MIN || req.key.len() > TRADE_KEY_MAX {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"key debe tener 8..64 chars"}))).into_response();
    }
    let from = req.from.to_uppercase();
    let to = req.to.to_uppercase();
    let (from_dp, to_dp) = match (token_cfg(&from), token_cfg(&to)) {
        (Some((_, fdp, _)), Some((_, tdp, _))) => (fdp, tdp),
        _ => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"unknown token"}))).into_response(),
    };
    if from == to || !req.amount.is_finite() || req.amount <= 0.0 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"monto invalido"}))).into_response();
    }
    // Fase D: SPIRAL entero (puente u64, sin polvo) y contra su ledger: verdad unica.
    let spiral_leg = from == "SPIRAL" || to == "SPIRAL";
    let amt = if spiral_leg { req.amount.floor() } else { req.amount };
    if spiral_leg && amt < 1.0 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"SPIRAL minimo 1"}))).into_response();
    }
    let pkey = format!("swap:{}", req.key);
    let now = Utc::now().timestamp();
    let mut st = s.trade.write().await;
    if let Some(prev) = st.processed.get(&pkey) {
        let mut replay = prev.clone();
        replay["replay"] = serde_json::json!(true);
        return (StatusCode::OK, Json(replay)).into_response();
    }
    let (pf, pt) = match (st.book.get(&from), st.book.get(&to)) {
        (Some(f), Some(t)) => (f.clone(), t.clone()),
        _ => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"unknown token"}))).into_response(),
    };
    if (!pf.internal && now - pf.ts > STALE_AFTER_SECS) || (!pt.internal && now - pt.ts > STALE_AFTER_SECS) {
        return (StatusCode::SERVICE_UNAVAILABLE, Json(serde_json::json!({"error":"oracle desactualizado: sin reportes frescos"}))).into_response();
    }
    let notional = amt * pf.price;
    if notional > MAX_NOTIONAL_USDT {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"monto excede tope por operacion"}))).into_response();
    }
    let fee_usd = notional * FEE_RATE;
    let receive = if to == "SPIRAL" { ((notional - fee_usd) / pt.price).floor() } else { round_dp((notional - fee_usd) / pt.price, to_dp) };
    if to == "SPIRAL" && receive < 1.0 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"recibes menos de 1 SPIRAL: sube el monto"}))).into_response();
    }
    // debito: check+mutacion juntos por store (orden de locks trade->ledger siempre)
    let left: f64;
    if from == "SPIRAL" {
        let mut led = s.ledger.write().await;
        let lb = led.balances.entry(sub.clone()).or_insert(0.0);
        if *lb + 1e-9 < amt {
            let have = *lb;
            drop(led);
            return (StatusCode::PAYMENT_REQUIRED, Json(serde_json::json!({"error":"saldo insuficiente", "have": have as u64}))).into_response();
        }
        *lb -= amt;
        left = *lb;
        save_ledger(&s.ledger_path, &led);
    } else {
        let have = st.balances.get(&sub).and_then(|b| b.get(&from)).copied().unwrap_or(0.0);
        if have + 1e-9 < amt {
            return (StatusCode::PAYMENT_REQUIRED, Json(serde_json::json!({"error":"saldo insuficiente", "have": round_dp(have, from_dp)}))).into_response();
        }
        left = round_dp(have - amt, from_dp);
        st.balances.entry(sub.clone()).or_default().insert(from.clone(), left);
    }
    // credito
    let got_new: f64;
    if to == "SPIRAL" {
        let mut led = s.ledger.write().await;
        let lb = led.balances.entry(sub.clone()).or_insert(0.0);
        *lb += receive;
        got_new = *lb;
        save_ledger(&s.ledger_path, &led);
    } else {
        let b = st.balances.entry(sub.clone()).or_default();
        let got = b.get(&to).copied().unwrap_or(0.0);
        got_new = round_dp(got + receive, to_dp);
        b.insert(to.clone(), got_new);
    }
    let tx = SwapTx {
        id: uuid::Uuid::new_v4().to_string(), key: req.key.clone(),
        from: from.clone(), to: to.clone(), amount: amt, receive,
        price_from: pf.price, price_to: pt.price, fee_usd: round_dp(fee_usd, 2), ts: now,
        kind: "swap".to_string(),
    };
    let hist = st.txs.entry(sub).or_default();
    hist.push(tx.clone());
    if hist.len() > HISTORY_CAP {
        hist.drain(..hist.len() - HISTORY_CAP);
    }
    *st.volume_usd.entry(to.clone()).or_insert(0.0) += notional;
    *st.fees_usd.entry(to.clone()).or_insert(0.0) += fee_usd;
    // Fase B: el fee alimenta el indice global del pool de salida
    accrue_fee(&mut st, &to, fee_usd, now);
    let resp = serde_json::json!({
        "from": from, "to": to, "amount": amt, "receive": receive,
        "price": pt.price, "fee_usd": round_dp(fee_usd, 2), "tx_id": tx.id,
        "key": req.key, "balances": { from.clone(): left, to.clone(): got_new },
    });
    st.processed.insert(pkey, resp.clone());
    save_trade(&s.state_path, &st);
    (StatusCode::OK, Json(resp)).into_response()
}

#[derive(Deserialize)]
struct HistQuery { limit: Option<usize>, offset: Option<usize> }

fn history_view(st: &TradeState, sub: &str, limit: usize, offset: usize) -> serde_json::Value {
    let all: Vec<SwapTx> = st.txs.get(sub).cloned().unwrap_or_default();
    let total = all.len();
    let offset = offset.min(total);
    let limit = limit.min(200).max(1);
    let page: Vec<SwapTx> = all.into_iter().rev().skip(offset).take(limit).collect();
    serde_json::json!({"txs": page, "total": total})
}

fn portfolio_view(st: &TradeState, spiral: f64, sub: &str, now: i64) -> serde_json::Value {
    let mut holdings = vec![];
    let mut total = 0.0;
    let mut toks: Vec<(String, f64)> = vec![];
    if let Some(b) = st.balances.get(sub) {
        for (tok, amt) in b {
            if *amt > 0.0 {
                toks.push((tok.clone(), *amt));
            }
        }
    }
    if spiral > 0.0 {
        toks.push(("SPIRAL".to_string(), spiral));
    }
    toks.sort_by(|a, b| a.0.cmp(&b.0));
    for (tok, amt) in toks {
        let (price, chg) = st.book.get(&tok).map(|e| (e.price, e.change_24h)).unwrap_or((0.0, 0.0));
        let value = amt * price;
        total += value;
        holdings.push(serde_json::json!({
            "token": tok, "amount": amt, "price": price,
            "value_usdt": round_dp(value, 2), "change_24h": chg,
        }));
    }
    let trades = st.txs.get(sub).map(|v| v.iter().filter(|t| t.kind != "transfer").count()).unwrap_or(0);
    serde_json::json!({
        "holdings": holdings, "total_usdt": round_dp(total, 2), "trades": trades, "ts": now,
    })
}

async fn trade_history(State(s): State<AppState>, headers: HeaderMap, Query(q): Query<HistQuery>) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    let st = s.trade.read().await;
    (StatusCode::OK, Json(history_view(&st, &sub, q.limit.unwrap_or(50), q.offset.unwrap_or(0)))).into_response()
}

async fn trade_portfolio(State(s): State<AppState>, headers: HeaderMap) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    let st = s.trade.read().await;
    let spiral = s.ledger.read().await.balances.get(&sub).copied().unwrap_or(0.0);
    (StatusCode::OK, Json(portfolio_view(&st, spiral, &sub, Utc::now().timestamp()))).into_response()
}

// Perfiles publicos (decision owner): portafolio e historial visibles sin sesion.
async fn public_portfolio(State(s): State<AppState>, Path(account): Path<String>) -> impl IntoResponse {
    if account.trim().is_empty() || account.len() > 64 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"cuenta invalida"}))).into_response();
    }
    let st = s.trade.read().await;
    let spiral = s.ledger.read().await.balances.get(&account).copied().unwrap_or(0.0);
    (StatusCode::OK, Json(portfolio_view(&st, spiral, &account, Utc::now().timestamp()))).into_response()
}

async fn public_history(State(s): State<AppState>, Path(account): Path<String>, Query(q): Query<HistQuery>) -> impl IntoResponse {
    if account.trim().is_empty() || account.len() > 64 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"cuenta invalida"}))).into_response();
    }
    let st = s.trade.read().await;
    (StatusCode::OK, Json(history_view(&st, &account, q.limit.unwrap_or(20).min(50), q.offset.unwrap_or(0)))).into_response()
}

#[derive(Deserialize)]
struct TransferReq {
    to_account: Option<String>,
    to_username: Option<String>,
    token: Option<String>,
    amount: f64,
    key: String,
}

async fn wou_account_for(s: &AppState, username: &str) -> Option<String> {
    if username.is_empty() || username.len() > 32
        || !username.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-' || c == '.')
    {
        return None;
    }
    let url = format!("{}/api/v1/user/by-username/{}", s.bridge_url.trim_end_matches('/'), username);
    let client = reqwest::Client::builder().timeout(std::time::Duration::from_secs(8)).build().ok()?;
    let body: serde_json::Value = client.get(&url).send().await.ok()?.json().await.ok()?;
    body.get("account_id").and_then(|v| v.as_str()).map(|v| v.to_string())
}

// Transferencia entre usuarios (cualquier token). El destino se resuelve por
// username en wou-id o directo por account_id. Ambos lados quedan en historial.
async fn trade_transfer(State(s): State<AppState>, headers: HeaderMap, Json(req): Json<TransferReq>) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    if req.key.len() < TRADE_KEY_MIN || req.key.len() > TRADE_KEY_MAX {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"key debe tener 8..64 chars"}))).into_response();
    }
    let token = req.token.unwrap_or_else(|| "USDT".to_string()).to_uppercase();
    let dp = match token_cfg(&token) {
        Some((_, dp, _)) => dp,
        None => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"unknown token"}))).into_response(),
    };
    if !req.amount.is_finite() || req.amount <= 0.0 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"monto invalido"}))).into_response();
    }
    let dest = match (req.to_account, req.to_username) {
        (Some(a), _) if !a.trim().is_empty() && a.len() <= 64 => a.trim().to_string(),
        (_, Some(u)) => match wou_account_for(&s, u.trim().trim_start_matches('@')).await {
            Some(a) => a,
            None => return (StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"usuario no existe"}))).into_response(),
        },
        _ => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"falta destino"}))).into_response(),
    };
    if dest == sub {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"no te puedes enviar a ti"}))).into_response();
    }
    let pkey = format!("transfer:{}", req.key);
    let now = Utc::now().timestamp();
    let mut st = s.trade.write().await;
    if let Some(prev) = st.processed.get(&pkey) {
        let mut replay = prev.clone();
        replay["replay"] = serde_json::json!(true);
        return (StatusCode::OK, Json(replay)).into_response();
    }
    // Fase D: SPIRAL viaja por el ledger del puente (verdad unica), entero.
    let amt = if token == "SPIRAL" { req.amount.floor() } else { round_dp(req.amount, dp) };
    if token == "SPIRAL" && amt < 1.0 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"SPIRAL minimo 1"}))).into_response();
    }
    let left: f64;
    if token == "SPIRAL" {
        let mut led = s.ledger.write().await;
        let have = led.balances.get(&sub).copied().unwrap_or(0.0);
        if have + 1e-9 < amt {
            drop(led);
            return (StatusCode::PAYMENT_REQUIRED, Json(serde_json::json!({"error":"saldo insuficiente", "have": have as u64}))).into_response();
        }
        led.balances.insert(sub.clone(), have - amt);
        let cur = led.balances.get(&dest).copied().unwrap_or(0.0);
        led.balances.insert(dest.clone(), cur + amt);
        save_ledger(&s.ledger_path, &led);
        left = have - amt;
    } else {
        let have = st.balances.get(&sub).and_then(|b| b.get(&token)).copied().unwrap_or(0.0);
        if have + 1e-9 < amt {
            return (StatusCode::PAYMENT_REQUIRED, Json(serde_json::json!({"error":"saldo insuficiente", "have": round_dp(have, dp)}))).into_response();
        }
        left = round_dp(have - amt, dp);
        {
            let b = st.balances.entry(sub.clone()).or_default();
            b.insert(token.clone(), left);
        }
        {
            let b = st.balances.entry(dest.clone()).or_default();
            let cur = b.get(&token).copied().unwrap_or(0.0);
            b.insert(token.clone(), round_dp(cur + amt, dp));
        }
    }
    let mk = |key: String| SwapTx {
        id: uuid::Uuid::new_v4().to_string(), key,
        from: token.clone(), to: token.clone(), amount: amt, receive: amt,
        price_from: 1.0, price_to: 1.0, fee_usd: 0.0, ts: now, kind: "transfer".to_string(),
    };
    let out_tx = mk(req.key.clone());
    let in_tx = mk(format!("in:{}", req.key));
    for (who, tx) in [(sub.clone(), out_tx), (dest.clone(), in_tx)] {
        let h = st.txs.entry(who).or_default();
        h.push(tx);
        if h.len() > HISTORY_CAP {
            h.drain(..h.len() - HISTORY_CAP);
        }
    }
    let resp = serde_json::json!({"to": dest, "token": token, "amount": amt, "balance": left, "key": req.key});
    st.processed.insert(pkey, resp.clone());
    save_trade(&s.state_path, &st);
    (StatusCode::OK, Json(resp)).into_response()
}

#[derive(Deserialize)]
struct PoolQuery { symbol: Option<String> }

async fn get_pools(Query(q): Query<PoolQuery>, State(s): State<AppState>) -> impl IntoResponse {
    // Pools reales: posiciones de usuarios + semilla de arranque (display, sin dueno).
    // La semilla NO entra al indice de fees: el 100% va a los LPs reales.
    let st = s.trade.read().await;
    let now = Utc::now().timestamp();
    let mut list: Vec<serde_json::Value> = TOKENS
        .iter()
        .map(|(tok, _, _)| {
            let price = st.book.get(*tok).map(|p| p.price).unwrap_or(0.0);
            let user_staked: f64 = st.positions.values()
                .filter(|p| &p.token == tok && p.state != "Dissolved")
                .map(|p| (p.amount - p.withdrawn).max(0.0)).sum();
            let seed = SEED_STAKE.iter().find(|(t, _)| t == tok).map(|(_, a)| *a).unwrap_or(0.0);
            let tvl = (user_staked + seed) * price;
            let fees_trail: f64 = st.fee_events.iter()
                .filter(|(ts, t, _)| t == tok && now - ts <= APY_WINDOW_SECS)
                .map(|(_, _, f)| f).sum();
            let apy = if tvl > 0.0 { fees_trail * (365.0 / 30.0) / tvl * 100.0 } else { 0.0 };
            let npos = st.positions.values().filter(|p| &p.token == tok && p.state != "Dissolved").count();
            serde_json::json!({
                "token": tok, "price": price,
                "total_staked": round_dp(user_staked, 6), "seed_staked": seed,
                "tvl": round_dp(tvl, 2), "global_index": st.fee_index.get(*tok).copied().unwrap_or(0.0),
                "volume_usd": round_dp(st.volume_usd.get(*tok).copied().unwrap_or(0.0), 2),
                "fees_usd": round_dp(st.fees_usd.get(*tok).copied().unwrap_or(0.0), 2),
                "apy_30d": round_dp(apy, 2), "positions": npos,
            })
        })
        .collect();
    list.sort_by(|a, b| b["tvl"].as_f64().unwrap_or(0.0).partial_cmp(&a["tvl"].as_f64().unwrap_or(0.0)).unwrap_or(std::cmp::Ordering::Equal));
    if let Some(f) = q.symbol.as_ref() {
        list.retain(|v| v["token"].as_str() == Some(&f.to_uppercase()));
    }
    Json(list)
}

#[derive(Deserialize)]
struct StakeTradeReq { token: String, amount: f64, dissolve_delay_secs: u64, key: String }

// Stake real: bloquea saldo, crea neurona Locked, sin accrual retroactivo.
async fn trade_stake(State(s): State<AppState>, headers: HeaderMap, Json(req): Json<StakeTradeReq>) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    if req.key.len() < TRADE_KEY_MIN || req.key.len() > TRADE_KEY_MAX {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"key debe tener 8..64 chars"}))).into_response();
    }
    let token = req.token.to_uppercase();
    let dp = match token_cfg(&token) {
        Some((_, dp, _)) => dp,
        None => return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"unknown token"}))).into_response(),
    };
    if !req.amount.is_finite() || req.amount <= 0.0 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"monto invalido"}))).into_response();
    }
    // Fase D: SPIRAL entero y contra su ledger (verdad unica).
    let amt = if token == "SPIRAL" { req.amount.floor() } else { req.amount };
    if token == "SPIRAL" && amt < 1.0 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"SPIRAL minimo 1"}))).into_response();
    }
    if req.dissolve_delay_secs < STAKE_MIN_DELAY_SECS || req.dissolve_delay_secs > STAKE_MAX_DELAY_SECS {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"plazo debe ser 1 dia..4 anos"}))).into_response();
    }
    let pkey = format!("stake:{}", req.key);
    let now = Utc::now().timestamp();
    let mut st = s.trade.write().await;
    if let Some(prev) = st.processed.get(&pkey) {
        let mut replay = prev.clone();
        replay["replay"] = serde_json::json!(true);
        return (StatusCode::OK, Json(replay)).into_response();
    }
    let price = match st.book.get(&token) {
        Some(e) if e.internal || now - e.ts <= STALE_AFTER_SECS => e.price,
        _ => return (StatusCode::SERVICE_UNAVAILABLE, Json(serde_json::json!({"error":"oracle desactualizado: sin reportes frescos"}))).into_response(),
    };
    if amt * price > STAKE_MAX_VALUE_USDT {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"stake excede tope por posicion"}))).into_response();
    }
    if token == "SPIRAL" {
        let mut led = s.ledger.write().await;
        let lb = led.balances.entry(sub.clone()).or_insert(0.0);
        if *lb + 1e-9 < amt {
            let have = *lb;
            drop(led);
            return (StatusCode::PAYMENT_REQUIRED, Json(serde_json::json!({"error":"saldo insuficiente", "have": have as u64}))).into_response();
        }
        *lb -= amt;
        save_ledger(&s.ledger_path, &led);
    } else {
        let have = st.balances.get(&sub).and_then(|b| b.get(&token)).copied().unwrap_or(0.0);
        if have + 1e-9 < amt {
            return (StatusCode::PAYMENT_REQUIRED, Json(serde_json::json!({"error":"saldo insuficiente", "have": round_dp(have, dp)}))).into_response();
        }
        st.balances.entry(sub.clone()).or_default().insert(token.clone(), round_dp(have - amt, dp));
    }
    let idx = st.fee_index.get(&token).copied().unwrap_or(0.0);
    let pos = Position {
        id: uuid::Uuid::new_v4().to_string(), sub: sub.clone(), token: token.clone(),
        amount: round_dp(amt, dp), delay_secs: req.dissolve_delay_secs, created_at: now,
        state: "Locked".to_string(), dissolving_started_at: None, withdrawn: 0.0, last_index: idx,
    };
    let view = position_view(&st, &pos, now);
    liq_log(&mut st, &sub, "stake", Some(pos.id.clone()), &token, pos.amount, now);
    st.positions.insert(pos.id.clone(), pos);
    let mut resp = view;
    resp["key"] = serde_json::json!(req.key);
    st.processed.insert(pkey, resp.clone());
    save_trade(&s.state_path, &st);
    (StatusCode::OK, Json(resp)).into_response()
}

async fn trade_positions(State(s): State<AppState>, headers: HeaderMap) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    let st = s.trade.read().await;
    let now = Utc::now().timestamp();
    let mut v: Vec<serde_json::Value> = st.positions.values()
        .filter(|p| p.sub == sub)
        .map(|p| position_view(&st, p, now))
        .collect();
    v.sort_by(|a, b| b["created_at"].as_i64().unwrap_or(0).cmp(&a["created_at"].as_i64().unwrap_or(0)));
    (StatusCode::OK, Json(serde_json::json!({"positions": v}))).into_response()
}

async fn trade_liq_txs(State(s): State<AppState>, headers: HeaderMap, Query(q): Query<HistQuery>) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    let st = s.trade.read().await;
    let all: Vec<LiqTx> = st.liq_txs.get(&sub).cloned().unwrap_or_default();
    let total = all.len();
    let offset = q.offset.unwrap_or(0).min(total);
    let limit = q.limit.unwrap_or(50).min(200).max(1);
    let page: Vec<LiqTx> = all.into_iter().rev().skip(offset).take(limit).collect();
    (StatusCode::OK, Json(serde_json::json!({"txs": page, "total": total}))).into_response()
}

async fn pos_start_dissolving(State(s): State<AppState>, headers: HeaderMap, Path(id): Path<String>) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    let now = Utc::now().timestamp();
    let mut st = s.trade.write().await;
    let ok = match st.positions.get_mut(&id) {
        Some(p) if p.sub == sub && p.state == "Locked" => {
            p.state = "Dissolving".to_string();
            p.dissolving_started_at = Some(now);
            true
        }
        Some(p) if p.sub == sub => false,
        _ => return (StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"position no existe"}))).into_response(),
    };
    if !ok {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"solo posiciones Locked disuelven"}))).into_response();
    }
    let snap = st.positions.get(&id).expect("existe").clone();
    let view = position_view(&st, &snap, now);
    liq_log(&mut st, &sub, "start_dissolving", Some(id), &snap.token, snap.amount, now);
    save_trade(&s.state_path, &st);
    (StatusCode::OK, Json(view)).into_response()
}

async fn pos_cancel_dissolving(State(s): State<AppState>, headers: HeaderMap, Path(id): Path<String>) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    let now = Utc::now().timestamp();
    let mut st = s.trade.write().await;
    let ok = match st.positions.get_mut(&id) {
        Some(p) if p.sub == sub && p.state == "Dissolving" => {
            // Cancelar reinicia la edad (anti-gaming legacy): vuelve Locked desde hoy.
            p.state = "Locked".to_string();
            p.dissolving_started_at = None;
            p.created_at = now;
            true
        }
        Some(p) if p.sub == sub => false,
        _ => return (StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"position no existe"}))).into_response(),
    };
    if !ok {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"solo posiciones Dissolving cancelan"}))).into_response();
    }
    let snap = st.positions.get(&id).expect("existe").clone();
    let view = position_view(&st, &snap, now);
    liq_log(&mut st, &sub, "cancel_dissolving", Some(id), &snap.token, snap.amount, now);
    save_trade(&s.state_path, &st);
    (StatusCode::OK, Json(view)).into_response()
}

// Cobra fees a USDT (el fee se cobro en valor USDT en el swap).
async fn pos_claim(State(s): State<AppState>, headers: HeaderMap, Path(id): Path<String>) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    let now = Utc::now().timestamp();
    let mut st = s.trade.write().await;
    let token = match st.positions.get(&id) {
        Some(p) if p.sub == sub => p.token.clone(),
        _ => return (StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"position no existe"}))).into_response(),
    };
    let idx = st.fee_index.get(&token).copied().unwrap_or(0.0);
    let mut p = st.positions.get(&id).expect("existe").clone();
    let got = round_dp(claimable(&p, idx, now), 2);
    if got > 0.0 {
        let b = st.balances.entry(sub.clone()).or_default();
        let u = b.get("USDT").copied().unwrap_or(0.0);
        b.insert("USDT".to_string(), round_dp(u + got, 2));
        p.last_index = idx;
        st.positions.insert(id.clone(), p.clone());
        liq_log(&mut st, &sub, "claim", Some(id.clone()), &token, got, now);
        save_trade(&s.state_path, &st);
    }
    let view = position_view(&st, &p, now);
    (StatusCode::OK, Json(serde_json::json!({"claimed_usdt": got, "position": view}))).into_response()
}

// Reinvierte fees a la posicion (convierte USDT->token a precio de libro).
async fn pos_compound(State(s): State<AppState>, headers: HeaderMap, Path(id): Path<String>) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    let now = Utc::now().timestamp();
    let mut st = s.trade.write().await;
    let (token, locked) = match st.positions.get(&id) {
        Some(p) if p.sub == sub => (p.token.clone(), p.state == "Locked"),
        _ => return (StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"position no existe"}))).into_response(),
    };
    if !locked {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"solo posiciones Locked componen"}))).into_response();
    }
    let idx = st.fee_index.get(&token).copied().unwrap_or(0.0);
    let price = match st.book.get(&token) {
        Some(e) if e.internal || now - e.ts <= STALE_AFTER_SECS => e.price,
        _ => return (StatusCode::SERVICE_UNAVAILABLE, Json(serde_json::json!({"error":"oracle desactualizado: sin reportes frescos"}))).into_response(),
    };
    let dp = token_cfg(&token).map(|(_, d, _)| d).unwrap_or(2);
    let (got, added) = {
        let p = st.positions.get_mut(&id).expect("existe");
        let c = round_dp(claimable(p, idx, now), 2);
        if c <= 0.0 {
            (0.0, 0.0)
        } else {
            let add = round_dp(c / price, dp);
            p.amount = round_dp(p.amount + add, dp);
            p.last_index = idx;
            (c, add)
        }
    };
    if got > 0.0 {
        liq_log(&mut st, &sub, "compound", Some(id.clone()), &token, added, now);
        save_trade(&s.state_path, &st);
    }
    let snap = st.positions.get(&id).expect("existe").clone();
    let view = position_view(&st, &snap, now);
    (StatusCode::OK, Json(serde_json::json!({"compounded_usdt": got, "added": added, "position": view}))).into_response()
}

#[derive(Deserialize)]
struct WithdrawReq { amount: f64, key: String }

async fn pos_withdraw(State(s): State<AppState>, headers: HeaderMap, Path(id): Path<String>, Json(req): Json<WithdrawReq>) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    if req.key.len() < TRADE_KEY_MIN || req.key.len() > TRADE_KEY_MAX {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"key debe tener 8..64 chars"}))).into_response();
    }
    if !req.amount.is_finite() || req.amount <= 0.0 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"monto invalido"}))).into_response();
    }
    let pkey = format!("wd:{}:{}", id, req.key);
    let now = Utc::now().timestamp();
    let mut st = s.trade.write().await;
    if let Some(prev) = st.processed.get(&pkey) {
        let mut replay = prev.clone();
        replay["replay"] = serde_json::json!(true);
        return (StatusCode::OK, Json(replay)).into_response();
    }
    let (token, dp, dissolvable) = match st.positions.get(&id) {
        Some(p) if p.sub == sub => (p.token.clone(), token_cfg(&p.token).map(|(_, d, _)| d).unwrap_or(2), p.state == "Dissolving" || p.state == "Dissolved"),
        _ => return (StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"position no existe"}))).into_response(),
    };
    if !dissolvable {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"disuelve primero"}))).into_response();
    }
    let avail = available_now(st.positions.get(&id).expect("existe"), now);
    let credited = if token == "SPIRAL" { req.amount.floor() } else { round_dp(req.amount, dp) };
    if token == "SPIRAL" && credited < 1.0 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"SPIRAL minimo 1"}))).into_response();
    }
    if credited - avail > 1e-9 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"excede lo liberado", "available": round_dp(avail, dp)}))).into_response();
    }
    {
        let p = st.positions.get_mut(&id).expect("existe");
        p.withdrawn = round_dp(p.withdrawn + credited, dp);
        if p.withdrawn + 1e-9 >= p.amount {
            p.state = "Dissolved".to_string();
        }
    }
    if token == "SPIRAL" {
        let mut led = s.ledger.write().await;
        let lb = led.balances.entry(sub.clone()).or_insert(0.0);
        *lb += credited;
        save_ledger(&s.ledger_path, &led);
    } else {
        let b = st.balances.entry(sub.clone()).or_default();
        let cur = b.get(&token).copied().unwrap_or(0.0);
        b.insert(token.clone(), round_dp(cur + credited, dp));
    }
    liq_log(&mut st, &sub, "withdraw", Some(id.clone()), &token, credited, now);
    let snap = st.positions.get(&id).expect("existe").clone();
    let view = position_view(&st, &snap, now);
    let mut resp = serde_json::json!({"withdrawn": credited, "position": view, "key": req.key});
    resp["available_now"] = view["available_now"].clone();
    st.processed.insert(pkey, resp.clone());
    save_trade(&s.state_path, &st);
    (StatusCode::OK, Json(resp)).into_response()
}

async fn pos_withdraw_available(State(s): State<AppState>, headers: HeaderMap, Path(id): Path<String>) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    let now = Utc::now().timestamp();
    let st = s.trade.read().await;
    let avail = match st.positions.get(&id) {
        Some(p) if p.sub == sub => available_now(p, now),
        _ => return (StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"position no existe"}))).into_response(),
    };
    drop(st);
    if avail <= 0.0 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"nada liberado aun"}))).into_response();
    }
    let auto_key = format!("auto-{}-{}", &id[..id.len().min(8)], now);
    pos_withdraw(State(s), headers, Path(id), Json(WithdrawReq { amount: avail, key: auto_key })).await.into_response()
}

#[derive(Deserialize)]
struct AddReq { amount: f64, key: String }

// Agrega a posicion Locked (cobra pendientes a USDT primero, sin accrual retroactivo).
async fn pos_add(State(s): State<AppState>, headers: HeaderMap, Path(id): Path<String>, Json(req): Json<AddReq>) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    if req.key.len() < TRADE_KEY_MIN || req.key.len() > TRADE_KEY_MAX {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"key debe tener 8..64 chars"}))).into_response();
    }
    if !req.amount.is_finite() || req.amount <= 0.0 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"monto invalido"}))).into_response();
    }
    let pkey = format!("add:{}:{}", id, req.key);
    let now = Utc::now().timestamp();
    let mut st = s.trade.write().await;
    if let Some(prev) = st.processed.get(&pkey) {
        let mut replay = prev.clone();
        replay["replay"] = serde_json::json!(true);
        return (StatusCode::OK, Json(replay)).into_response();
    }
    let (token, locked) = match st.positions.get(&id) {
        Some(p) if p.sub == sub => (p.token.clone(), p.state == "Locked"),
        _ => return (StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"position no existe"}))).into_response(),
    };
    if !locked {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"solo posiciones Locked reciben"}))).into_response();
    }
    let dp = token_cfg(&token).map(|(_, d, _)| d).unwrap_or(2);
    let amt = if token == "SPIRAL" { req.amount.floor() } else { req.amount };
    if token == "SPIRAL" && amt < 1.0 {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"SPIRAL minimo 1"}))).into_response();
    }
    if token == "SPIRAL" {
        let mut led = s.ledger.write().await;
        let lb = led.balances.entry(sub.clone()).or_insert(0.0);
        if *lb + 1e-9 < amt {
            let have = *lb;
            drop(led);
            return (StatusCode::PAYMENT_REQUIRED, Json(serde_json::json!({"error":"saldo insuficiente", "have": have as u64}))).into_response();
        }
        *lb -= amt;
        save_ledger(&s.ledger_path, &led);
    } else {
        let have = st.balances.get(&sub).and_then(|b| b.get(&token)).copied().unwrap_or(0.0);
        if have + 1e-9 < amt {
            return (StatusCode::PAYMENT_REQUIRED, Json(serde_json::json!({"error":"saldo insuficiente", "have": round_dp(have, dp)}))).into_response();
        }
        st.balances.entry(sub.clone()).or_default().insert(token.clone(), round_dp(have - amt, dp));
    }
    let idx = st.fee_index.get(&token).copied().unwrap_or(0.0);
    let mut p = st.positions.get(&id).expect("existe").clone();
    let settled = round_dp(claimable(&p, idx, now), 2);
    if settled > 0.0 {
        let b = st.balances.entry(sub.clone()).or_default();
        let u = b.get("USDT").copied().unwrap_or(0.0);
        b.insert("USDT".to_string(), round_dp(u + settled, 2));
        p.last_index = idx;
    }
    p.amount = round_dp(p.amount + amt, dp);
    st.positions.insert(id.clone(), p.clone());
    liq_log(&mut st, &sub, "add", Some(id.clone()), &token, amt, now);
    let view = position_view(&st, &p, now);
    let resp = serde_json::json!({"added": amt, "settled_usdt": settled, "position": view, "key": req.key});
    st.processed.insert(pkey, resp.clone());
    save_trade(&s.state_path, &st);
    (StatusCode::OK, Json(resp)).into_response()
}

// Sin oraculo propio: los precios los reporta cada navegador desde su Binance
// gratis (directiva owner). Ver report_prices + seed_trade.

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_env_filter(EnvFilter::from_default_env()).init();
    let ledger_path = std::env::var("LEDGER_PATH")
        .unwrap_or_else(|_| "/var/db/ionicswap/ledger.json".to_string());
    let ledger: Ledger = std::fs::read_to_string(&ledger_path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default();
    let jwt_secret = std::env::var("WOU_JWT_SECRET").unwrap_or_default();
    if jwt_secret.is_empty() {
        tracing::warn!("WOU_JWT_SECRET vacio: /api/ledger/* respondera 401");
    }
    let bridge_url = std::env::var("WOU_BRIDGE_URL").unwrap_or_else(|_| "https://id.worldofunreal.com".to_string());
    let bridge_secret = std::env::var("WOU_BRIDGE_SECRET").unwrap_or_default();
    if bridge_secret.is_empty() {
        tracing::warn!("WOU_BRIDGE_SECRET vacio: /api/spiral/* respondera 503");
    }
    let state_path = std::env::var("STATE_PATH")
        .unwrap_or_else(|_| "/var/db/ionicswap/state.json".to_string());
    let trade: TradeState = std::fs::read_to_string(&state_path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_else(seed_trade);
    let state = AppState {
        trade: Arc::new(RwLock::new(trade)),
        state_path,
        ledger: Arc::new(RwLock::new(ledger)),
        ledger_path,
        jwt_secret,
        bridge_url,
        bridge_secret,
    };
    let cors = CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any);
    let app = Router::new()
        .route("/health", get(health))
        .route("/api/prices", get(get_prices))
        .route("/api/price/:symbol", get(get_price))
        .route("/api/tokens", get(get_tokens))
        .route("/api/prices/report", post(report_prices))
        .route("/api/faucet", post(trade_faucet))
        .route("/api/balances", get(trade_balances))
        .route("/api/swap", post(trade_swap))
        .route("/api/history", get(trade_history))
        .route("/api/history/:account", get(public_history))
        .route("/api/portfolio", get(trade_portfolio))
        .route("/api/portfolio/:account", get(public_portfolio))
        .route("/api/transfer", post(trade_transfer))
        .route("/api/pools", get(get_pools))
        .route("/api/stake", post(trade_stake))
        .route("/api/positions", get(trade_positions))
        .route("/api/positions/:id/start-dissolving", post(pos_start_dissolving))
        .route("/api/positions/:id/cancel-dissolving", post(pos_cancel_dissolving))
        .route("/api/positions/:id/claim", post(pos_claim))
        .route("/api/positions/:id/compound", post(pos_compound))
        .route("/api/positions/:id/withdraw", post(pos_withdraw))
        .route("/api/positions/:id/withdraw-available", post(pos_withdraw_available))
        .route("/api/positions/:id/add", post(pos_add))
        .route("/api/liquidity/transactions", get(trade_liq_txs))
        .route("/api/ledger/balance", get(ledger_balance))
        .route("/api/ledger/faucet", post(ledger_faucet))
        .route("/api/ledger/debit", post(ledger_debit))
        .route("/api/ledger/credit", post(ledger_credit))
        .route("/api/spiral/deposit", post(spiral_deposit))
        .route("/api/spiral/withdraw", post(spiral_withdraw))
        .with_state(state)
        .layer(cors);
    let port: u16 = std::env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(8081);
    let addr = format!("0.0.0.0:{}", port);
    println!("ionicswap-server listening on {} (client-reported oracle, no DFX)", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
