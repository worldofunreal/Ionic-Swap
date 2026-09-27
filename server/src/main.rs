use axum::{
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::RwLock;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::EnvFilter;

// ponytail: minimal off-chain Rust — single file, no DB, free oracle
#[derive(Clone, Serialize, Deserialize)]
struct Price { symbol: String, price: f64, change_24h: f64, ts: i64 }

#[derive(Clone, Serialize, Deserialize)]
struct SwapReq { from: String, to: String, amount: f64 }

#[derive(Clone, Serialize, Deserialize)]
struct SwapResp { from: String, to: String, amount: f64, receive: f64, price: f64, fee: f64, tx_id: String }

#[derive(Clone, Serialize, Deserialize)]
struct StakeReq { token: String, amount: f64, dissolve_delay_secs: u64 }

#[derive(Clone, Serialize, Deserialize)]
struct StakeResp { position_id: String, token: String, amount: f64, voting_power: f64, apy: f64 }

#[derive(Clone)]
struct AppState {
    prices: Arc<RwLock<HashMap<String, Price>>>,
    // mock pools: token -> (total_staked, total_fees)
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

async fn health() -> impl IntoResponse { Json(serde_json::json!({"status":"ok","service":"ionicswap-server","chain":"freebsd-native","oracle":"binance+coingecko free"})) }

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

async fn get_prices(State(s): State<AppState>) -> impl IntoResponse {
    let m = s.prices.read().await;
    let v: Vec<Price> = m.values().cloned().collect();
    Json(v)
}

async fn get_price(Path(sym): Path<String>, State(s): State<AppState>) -> impl IntoResponse {
    let m = s.prices.read().await;
    if let Some(p) = m.get(&sym.to_uppercase()) { (StatusCode::OK, Json(serde_json::to_value(p).unwrap())).into_response() }
    else { (StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"unknown token"}))).into_response() }
}

#[derive(Deserialize)]
struct PoolQuery { symbol: Option<String> }

async fn get_pools(Query(q): Query<PoolQuery>, State(s): State<AppState>) -> impl IntoResponse {
    let pools = s.pools.read().await;
    let prices = s.prices.read().await;
    let list: Vec<serde_json::Value> = pools.iter().map(|(tok,(staked,fees))| {
        let price = prices.get(tok).map(|p| p.price).unwrap_or(1.0);
        serde_json::json!({"token":tok,"total_staked":staked,"total_fees":fees,"price":price,"tvl": staked*price})
    }).filter(|v| q.symbol.as_ref().map(|f| v["token"].as_str()==Some(&f.to_uppercase())).unwrap_or(true)).collect();
    Json(list)
}

async fn post_swap(State(s): State<AppState>, Json(req): Json<SwapReq>) -> impl IntoResponse {
    let prices = s.prices.read().await;
    let from_p = prices.get(&req.from.to_uppercase());
    let to_p = prices.get(&req.to.to_uppercase());
    if from_p.is_none() || to_p.is_none() { return (StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"unknown token pair"}))).into_response(); }
    let from_price = from_p.unwrap().price;
    let to_price = to_p.unwrap().price;
    // fee model MVP 0.3% base (from LIQUIDITY_STAKING_MVP)
    let fee_rate = 0.003;
    let notional_usd = req.amount * from_price;
    let fee_usd = notional_usd * fee_rate;
    let receive_usd = notional_usd - fee_usd;
    let receive = receive_usd / to_price;
    // update mock pool fees
    drop(prices);
    {
        let mut pools = s.pools.write().await;
        let e = pools.entry(req.to.to_uppercase()).or_insert((0.0,0.0));
        e.1 += fee_usd;
    }
    let resp = SwapResp { from: req.from.to_uppercase(), to: req.to.to_uppercase(), amount: req.amount, receive, price: to_price, fee: fee_usd / from_price, tx_id: uuid::Uuid::new_v4().to_string() };
    (StatusCode::OK, Json(serde_json::to_value(resp).unwrap())).into_response()
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

async fn refresh_prices(state: AppState) {
    // free oracle: Binance public ticker (no key) + fallback to static
    let client = reqwest::Client::new();
    let symbols = vec!["BTC","ETH","SOL","XRP","BNB","DOGE","ADA","TRX","ICP"];
    let binance_map = HashMap::from([("BTC","BTCUSDT"),("ETH","ETHUSDT"),("SOL","SOLUSDT"),("XRP","XRPUSDT"),("BNB","BNBUSDT"),("DOGE","DOGEUSDT"),("ADA","ADAUSDT"),("TRX","TRXUSDT")]);
    loop {
        for sym in &symbols {
            let price_opt = if let Some(pair) = binance_map.get(*sym) {
                let url = format!("https://api.binance.com/api/v3/ticker/price?symbol={}", pair);
                match client.get(&url).send().await {
                    Ok(r) if r.status().is_success() => {
                        if let Ok(v) = r.json::<serde_json::Value>().await { v["price"].as_str().and_then(|s| s.parse::<f64>().ok()) } else { None }
                    } _ => None
                }
            } else { None };
            let fallback = match *sym {"BTC"=>58451.25,"ETH"=>3120.4,"SOL"=>142.25,"ICP"=>8.91,"XRP"=>0.62,"BNB"=>605.12,"DOGE"=>0.14,"ADA"=>0.45,"TRX"=>0.11,_=>1.0};
            let price = price_opt.unwrap_or(fallback);
            let mut m = state.prices.write().await;
            let prev = m.get(*sym).map(|p| p.price).unwrap_or(price);
            let chg = if prev!=0.0 {(price-prev)/prev*100.0} else {0.0};
            m.insert(sym.to_string(), Price{ symbol: sym.to_string(), price, change_24h: chg, ts: Utc::now().timestamp() });
        }
        // ICP from coingecko free (no key)
        if let Ok(r) = client.get("https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd").send().await {
            if let Ok(v) = r.json::<serde_json::Value>().await { if let Some(p) = v["internet-computer"]["usd"].as_f64() {
                let mut m = state.prices.write().await;
                let prev = m.get("ICP").map(|p| p.price).unwrap_or(p);
                let chg = if prev!=0.0 {(p-prev)/prev*100.0} else {0.0};
                m.insert("ICP".to_string(), Price{ symbol:"ICP".to_string(), price:p, change_24h: chg, ts: Utc::now().timestamp() });
            }}
        }
        tokio::time::sleep(std::time::Duration::from_secs(30)).await;
    }
}

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
    let state = AppState {
        prices: Arc::new(RwLock::new(HashMap::from([
            ("BTC".to_string(), Price{ symbol:"BTC".to_string(), price:58451.25, change_24h:4.12, ts: Utc::now().timestamp()}),
            ("ETH".to_string(), Price{ symbol:"ETH".to_string(), price:3120.4, change_24h:2.84, ts: Utc::now().timestamp()}),
            ("SOL".to_string(), Price{ symbol:"SOL".to_string(), price:142.25, change_24h:8.25, ts: Utc::now().timestamp()}),
            ("ICP".to_string(), Price{ symbol:"ICP".to_string(), price:8.91, change_24h:-1.15, ts: Utc::now().timestamp()}),
            ("XRP".to_string(), Price{ symbol:"XRP".to_string(), price:0.62, change_24h:1.82, ts: Utc::now().timestamp()}),
            ("BNB".to_string(), Price{ symbol:"BNB".to_string(), price:605.12, change_24h:0.94, ts: Utc::now().timestamp()}),
            ("DOGE".to_string(), Price{ symbol:"DOGE".to_string(), price:0.14, change_24h:-2.31, ts: Utc::now().timestamp()}),
            ("ADA".to_string(), Price{ symbol:"ADA".to_string(), price:0.45, change_24h:3.12, ts: Utc::now().timestamp()}),
            ("TRX".to_string(), Price{ symbol:"TRX".to_string(), price:0.11, change_24h:0.55, ts: Utc::now().timestamp()}),
            ("USDT".to_string(), Price{ symbol:"USDT".to_string(), price:1.0, change_24h:0.0, ts: Utc::now().timestamp()}),
        ]))),
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
    let s2 = state.clone();
    tokio::spawn(async move { refresh_prices(s2).await; });
    let cors = CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any);
    let app = Router::new()
        .route("/health", get(health))
        .route("/api/prices", get(get_prices))
        .route("/api/price/:symbol", get(get_price))
        .route("/api/pools", get(get_pools))
        .route("/api/swap", post(post_swap))
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
    println!("ionicswap-server listening on {} (free oracle, no DFX)", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
