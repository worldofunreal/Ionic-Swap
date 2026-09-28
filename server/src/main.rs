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

#[derive(Clone, Serialize, Deserialize)]
struct SwapTx {
    id: String, key: String, from: String, to: String,
    amount: f64, receive: f64, price_from: f64, price_to: f64,
    fee_usd: f64, ts: i64,
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
}

fn token_cfg(sym: &str) -> Option<(&'static str, u32, bool)> {
    TOKENS.iter().find(|(t, _, _)| *t == sym).copied()
}

fn round_dp(v: f64, dp: u32) -> f64 {
    let m = 10f64.powi(dp as i32);
    (v * m).round() / m
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
    for sym in ["USDT", "IONIC", "UNREAL"] {
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

#[derive(Clone)]
struct AppState {
    // libro de precios agregado de reportes de navegadores (Fase A)
    trade: Arc<RwLock<TradeState>>,
    state_path: String,
    // mock pools: token -> (total_staked, total_fees) — Fase B los vuelve reales
    pools: Arc<RwLock<HashMap<String, (f64, f64)>>>,
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
    let notional = req.amount * pf.price;
    if notional > MAX_NOTIONAL_USDT {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"monto excede tope por operacion"}))).into_response();
    }
    let have = st.balances.get(&sub).and_then(|b| b.get(&from)).copied().unwrap_or(0.0);
    if have + 1e-9 < req.amount {
        return (StatusCode::PAYMENT_REQUIRED, Json(serde_json::json!({"error":"saldo insuficiente", "have": round_dp(have, from_dp)}))).into_response();
    }
    let fee_usd = notional * FEE_RATE;
    let receive = round_dp((notional - fee_usd) / pt.price, to_dp);
    let left = round_dp(have - req.amount, from_dp);
    {
        let b = st.balances.entry(sub.clone()).or_default();
        b.insert(from.clone(), left);
        let got = b.get(&to).copied().unwrap_or(0.0);
        b.insert(to.clone(), round_dp(got + receive, to_dp));
    }
    let tx = SwapTx {
        id: uuid::Uuid::new_v4().to_string(), key: req.key.clone(),
        from: from.clone(), to: to.clone(), amount: req.amount, receive,
        price_from: pf.price, price_to: pt.price, fee_usd: round_dp(fee_usd, 2), ts: now,
    };
    let hist = st.txs.entry(sub).or_default();
    hist.push(tx.clone());
    if hist.len() > HISTORY_CAP {
        hist.drain(..hist.len() - HISTORY_CAP);
    }
    *st.volume_usd.entry(to.clone()).or_insert(0.0) += notional;
    *st.fees_usd.entry(to.clone()).or_insert(0.0) += fee_usd;
    let resp = serde_json::json!({
        "from": from, "to": to, "amount": req.amount, "receive": receive,
        "price": pt.price, "fee_usd": round_dp(fee_usd, 2), "tx_id": tx.id,
        "key": req.key, "balances": { from.clone(): left, to.clone(): round_dp(tx.receive + 0.0, to_dp) },
    });
    st.processed.insert(pkey, resp.clone());
    save_trade(&s.state_path, &st);
    (StatusCode::OK, Json(resp)).into_response()
}

#[derive(Deserialize)]
struct HistQuery { limit: Option<usize>, offset: Option<usize> }

async fn trade_history(State(s): State<AppState>, headers: HeaderMap, Query(q): Query<HistQuery>) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    let st = s.trade.read().await;
    let all: Vec<SwapTx> = st.txs.get(&sub).cloned().unwrap_or_default();
    let total = all.len();
    let offset = q.offset.unwrap_or(0).min(total);
    let limit = q.limit.unwrap_or(50).min(200).max(1);
    let page: Vec<SwapTx> = all.into_iter().rev().skip(offset).take(limit).collect();
    (StatusCode::OK, Json(serde_json::json!({"txs": page, "total": total}))).into_response()
}

async fn trade_portfolio(State(s): State<AppState>, headers: HeaderMap) -> impl IntoResponse {
    let sub = match auth_sub(&headers, &s.jwt_secret) {
        Ok(sub) => sub,
        Err(code) => return (code, Json(serde_json::json!({"error":"unauthorized"}))).into_response(),
    };
    let st = s.trade.read().await;
    let now = Utc::now().timestamp();
    let mut holdings = vec![];
    let mut total = 0.0;
    if let Some(b) = st.balances.get(&sub) {
        let mut toks: Vec<(&String, &f64)> = b.iter().filter(|(_, a)| **a > 0.0).collect();
        toks.sort_by(|a, b| a.0.cmp(b.0));
        for (tok, amt) in toks {
            let (price, chg) = st.book.get(tok).map(|e| (e.price, e.change_24h)).unwrap_or((0.0, 0.0));
            let value = amt * price;
            total += value;
            holdings.push(serde_json::json!({
                "token": tok, "amount": amt, "price": price,
                "value_usdt": round_dp(value, 2), "change_24h": chg,
            }));
        }
    }
    let trades = st.txs.get(&sub).map(|v| v.len()).unwrap_or(0);
    (StatusCode::OK, Json(serde_json::json!({
        "holdings": holdings, "total_usdt": round_dp(total, 2), "trades": trades, "ts": now,
    }))).into_response()
}

#[derive(Deserialize)]
struct PoolQuery { symbol: Option<String> }

async fn get_pools(Query(q): Query<PoolQuery>, State(s): State<AppState>) -> impl IntoResponse {
    // Fase B: pools reales desde posiciones. Hoy: semilla + contadores de swaps.
    let pools = s.pools.read().await;
    let st = s.trade.read().await;
    let list: Vec<serde_json::Value> = pools.iter().map(|(tok,(staked,fees))| {
        let price = st.book.get(tok).map(|p| p.price).unwrap_or(1.0);
        let vol = st.volume_usd.get(tok).copied().unwrap_or(0.0);
        let afe = st.fees_usd.get(tok).copied().unwrap_or(0.0);
        serde_json::json!({"token":tok,"total_staked":staked,"total_fees":round_dp(fees+afe,2),"price":price,"tvl": round_dp(staked*price,2),"volume_usd_24h": round_dp(vol,2)})
    }).filter(|v| q.symbol.as_ref().map(|f| v["token"].as_str()==Some(&f.to_uppercase())).unwrap_or(true)).collect();
    Json(list)
}

async fn post_stake(State(s): State<AppState>, Json(req): Json<StakeReq>) -> impl IntoResponse {
    // voting_power = stake * delay_mult (MVP: 1d=1.0, 30d=2.0, 365d=5.0 linear)
    let days = req.dissolve_delay_secs as f64 / 86400.0;
    let delay_mult = if days <= 1.0 {1.0} else if days <= 30.0 {1.0 + (days-1.0)/29.0} else if days <= 365.0 {2.0 + (days-30.0)/335.0*3.0} else {5.0};
    let voting_power = req.amount * delay_mult;
    let apy = 0.0625 * delay_mult; // from frontend calc
    {
        let mut pools = s.pools.write().await;
        let e = pools.entry(req.token.to_uppercase()).or_insert((0.0,0.0));
        e.0 += req.amount;
    }
    let resp = StakeResp { position_id: format!("{}-{}-{}", req.token.to_uppercase(), Utc::now().timestamp(), &uuid::Uuid::new_v4().to_string()[..8]), token: req.token.to_uppercase(), amount: req.amount, voting_power, apy };
    (StatusCode::OK, Json(serde_json::to_value(resp).unwrap())).into_response()
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
        pools: Arc::new(RwLock::new(HashMap::from([
            ("IONIC".to_string(), (125000.0, 3420.0)),
            ("UNREAL".to_string(), (12000.0, 890.0)),
            ("BTC".to_string(), (2.10, 120.0)),
            ("SOL".to_string(), (840.0, 45.0)),
            ("XRP".to_string(), (45000.0, 210.0)),
        ]))),
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
        .route("/api/portfolio", get(trade_portfolio))
        .route("/api/pools", get(get_pools))
        .route("/api/stake", post(post_stake))
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
