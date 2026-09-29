#!/usr/bin/env python3
"""Ionic Swap — external price-oracle feeder.

Why this exists
---------------
The Rust server on IONOS cannot fetch prices from Binance: Binance answers
HTTP 451 (blocked) to that datacenter IP. The old oracle relied on browsers
reporting prices, so whenever nobody visited the site the book went stale and
`/api/swap` refused to trade.

This tiny daemon runs on a machine that *can* reach Binance (e.g. an Orange Pi
on the home LAN), reads 24h tickers and pushes them to the server over HTTPS
via POST /api/oracle/feed, authenticated with a pre-shared key.

Stdlib only (no pip). Managed by systemd (see the .service file next to this
one). Safe to run forever: it retries on every kind of error and never exits.

Env overrides
-------------
IONIC_FEED_URL         default https://ionicswap.com/api/oracle/feed
IONIC_ORACLE_KEY_PATH  default /etc/ionicswap/oracle.key
IONIC_FEED_INTERVAL    default 30 (seconds between pushes)
IONIC_FEED_FORCE       default 0  (1 = bypass server's 25% deviation guard)

Run once for a smoke test:  ionicswap-oracle-feeder.py --once
"""

import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.request

FEED_URL = os.environ.get("IONIC_FEED_URL", "https://ionicswap.com/api/oracle/feed")
KEY_PATH = os.environ.get("IONIC_ORACLE_KEY_PATH", "/etc/ionicswap/oracle.key")
INTERVAL = max(10, int(os.environ.get("IONIC_FEED_INTERVAL", "30")))
FORCE = os.environ.get("IONIC_FEED_FORCE", "0") == "1"

# Binance pairs -> internal token symbol on the server. Internal tokens
# (USDT/IONIC/UNREAL/SPIRAL) are priced by the server itself and are skipped.
PAIRS = {
    "BTCUSDT": "BTC",
    "ETHUSDT": "ETH",
    "SOLUSDT": "SOL",
    "XRPUSDT": "XRP",
    "BNBUSDT": "BNB",
    "DOGEUSDT": "DOGE",
    "ADAUSDT": "ADA",
    "TRXUSDT": "TRX",
    "ICPUSDT": "ICP",
}

# api.binance.com first; data-api.binance.vision is the public market-data
# mirror Binance publishes precisely for geo/IP-blocked clients.
SOURCES = [
    "https://api.binance.com/api/v3/ticker/24hr?symbols=",
    "https://data-api.binance.vision/api/v3/ticker/24hr?symbols=",
]

SSL_CTX = ssl.create_default_context()
UA = {"User-Agent": "ionicswap-oracle-feeder/1.0"}


def log(msg):
    print(f"{time.strftime('%Y-%m-%dT%H:%M:%S%z')} {msg}", flush=True)


def read_key():
    key = os.environ.get("IONIC_ORACLE_KEY", "").strip()
    if key:
        return key
    try:
        with open(KEY_PATH, "r", encoding="utf-8") as fh:
            return fh.read().strip()
    except OSError as exc:
        log(f"FATAL could not read oracle key {KEY_PATH}: {exc}")
        sys.exit(1)


def http_get(url, timeout=15):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
        return resp.read()


def fetch_tickers():
    """Return {token_symbol: (price, change_24h)} from the first source that answers."""
    symbols = json.dumps(list(PAIRS.keys()), separators=(",", ":"))
    from urllib.parse import quote

    last_err = None
    for base in SOURCES:
        url = base + quote(symbols)
        try:
            raw = http_get(url)
            rows = json.loads(raw)
            if not isinstance(rows, list):
                last_err = RuntimeError(f"unexpected payload from {base}")
                continue
            out = {}
            for row in rows:
                pair = row.get("symbol")
                token = PAIRS.get(pair)
                if not token:
                    continue
                try:
                    price = float(row["lastPrice"])
                    change = float(row.get("priceChangePercent", "0") or 0.0)
                except (KeyError, TypeError, ValueError):
                    continue
                if price > 0:
                    out[token] = (price, change)
            if out:
                log(f"fetched {len(out)} tickers from {base.split('/')[2]}")
                return out
            last_err = RuntimeError(f"no usable tickers from {base}")
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError) as exc:
            last_err = exc
            log(f"source {base.split('/')[2]} failed: {exc}")
    raise RuntimeError(f"all price sources failed: {last_err}")


def push(key, prices):
    body = {
        "source": "binance-24hr",
        "force": FORCE,
        "observations": [
            {"symbol": token, "price": price, "change_24h": change}
            for token, (price, change) in sorted(prices.items())
        ],
    }
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        FEED_URL,
        data=data,
        method="POST",
        headers={**UA, "Content-Type": "application/json", "X-Oracle-Key": key},
    )
    with urllib.request.urlopen(req, timeout=15, context=SSL_CTX) as resp:
        return resp.status, json.loads(resp.read() or b"{}")


def main():
    once = "--once" in sys.argv
    key = read_key()
    log(f"feeder starting: url={FEED_URL} interval={INTERVAL}s force={FORCE} once={once}")
    while True:
        try:
            prices = fetch_tickers()
            status, out = push(key, prices)
            log(f"push -> HTTP {status} {json.dumps(out)}")
        except urllib.error.HTTPError as exc:
            detail = ""
            try:
                detail = exc.read().decode("utf-8", "replace")[:200]
            except Exception:
                pass
            log(f"push failed: HTTP {exc.code} {detail}")
        except Exception as exc:  # never die
            log(f"cycle error: {type(exc).__name__}: {exc}")
        if once:
            return
        time.sleep(INTERVAL)


if __name__ == "__main__":
    main()
