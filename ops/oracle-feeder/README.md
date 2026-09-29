# Ionic Swap oracle feeder

The Rust server that serves `ionicswap.com` runs on IONOS. Binance blocks that
datacenter IP (HTTP `451`), so the server cannot fetch prices itself. The old
design worked around this by having each **browser** report Binance prices
(`POST /api/prices/report`), which meant the price book froze whenever nobody
was on the site — `stale: true`, `change_24h: 0.0`, and `/api/swap` refusing
trades.

This feeder solves it properly: a small always-on machine that **can** reach
Binance pushes prices to the server on a schedule.

```
Orange Pi (home LAN, Binance OK)  --30s-->  POST https://ionicswap.com/api/oracle/feed
                                                  (X-Oracle-Key: <shared secret>)
                                                  --> Rust server book -> /api/prices, /api/swap
```

## Files

| file | goes to | notes |
|------|---------|-------|
| `ionicswap-oracle-feeder.py` | `/usr/local/bin/` | stdlib-only Python 3, `chmod +x` |
| `ionicswap-oracle-feeder.service` | `/etc/systemd/system/` | `systemctl enable --now` |
| shared key | `/etc/ionicswap/oracle.key` | `chmod 600`, same value as on the server |

## Server side

The Rust server (`server/src/main.rs`) exposes `POST /api/oracle/feed`. It
authenticates the request against a shared key read from, in order:

1. env `ORACLE_FEED_SECRET`
2. file `ORACLE_KEY_PATH` (default `/var/db/ionicswap/oracle_key`)

Using the file means the key survives CI deploys (the deploy workflow rewrites
`/usr/local/etc/ionicswap.env`). Create it once:

```sh
sudo sh -c 'openssl rand -hex 32 > /var/db/ionicswap/oracle_key'
sudo chmod 600 /var/db/ionicswap/oracle_key
sudo service ionicswap restart
```

The endpoint is idempotent and safe:

* only non-internal tokens (BTC, ETH, SOL, ICP, XRP, BNB, DOGE, ADA, TRX) are accepted;
* when the existing book entry is **stale** the 25 % deviation guard is
  bypassed so the book can resync after an outage;
* when the book is **fresh** the guard applies, so a rogue/misconfigured feeder
  cannot move a price more than 25 % in one step;
* `force: true` in the body bypasses the guard unconditionally (use sparingly,
  e.g. a deliberate re-baseline).

Verify from anywhere:

```sh
curl -s https://ionicswap.com/api/prices | python3 -m json.tool | head
```

Every external token should now show `"stale": false` and a real `change_24h`.

## Install on the feeder host

```sh
sudo install -m 755 ionicswap-oracle-feeder.py /usr/local/bin/
sudo install -m 644 ionicswap-oracle-feeder.service /etc/systemd/system/
sudo install -d -m 700 /etc/ionicswap
sudo sh -c 'printf %s "<KEY>" > /etc/ionicswap/oracle.key'
sudo chmod 600 /etc/ionicswap/oracle.key
sudo /usr/local/bin/ionicswap-oracle-feeder.py --once   # smoke test
sudo systemctl daemon-reload
sudo systemctl enable --now ionicswap-oracle-feeder
journalctl -u ionicswap-oracle-feeder -f
```
