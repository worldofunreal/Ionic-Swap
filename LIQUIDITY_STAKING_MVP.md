### Ionic Swap Liquidity Staking — MVP and Next Steps

This document specifies a neuron-inspired liquidity staking system, a protected quote/fee engine for swaps, and a phased path from internal tokens (MVP) to real tokens (GMX-like risk model).

## Objectives
- **Protect LPs**: Charge fees and spreads; defend against oracle-lag arbitrage.
- **Incentivize commitment**: Staking with dissolve delays and age bonuses (ICP neuron model).
- **Fair distribution**: Fee accrual via a global index weighted by voting power.
- **Phaseable governance**: Start with admin params, graduate to a Liquidity DAO.

## Core Concepts
- **Liquidity Neuron**: A staked position per user per token with fields: user, token_symbol, staked_amount, dissolve_delay_seconds, created_at, state, dissolving_started_at, total_fees_earned, last_index.
- **States**: Locked → Dissolving → Dissolved. Starting dissolving resets age bonus to 1.0.
- **Voting Power (W_i)**: stake × delay_multiplier × age_multiplier (age multiplier = 1.0 when Dissolving).
- **Global Fee Index (per token)**: Accumulator used to distribute fees proportionally to voting power.

## Fee & Spread Model (CEX-like)
- **Oracle mid** with TWAP and staleness checks.
- **Spread s** = s_base + k_stale × staleness_sec + k_vol × recent_vol + k_depth × (trade_size / pool_liquidity), capped.
- **Bid/Ask**:
  - bid = max(P_twap, P_oracle) × (1 − s)
  - ask = min(P_twap, P_oracle) × (1 + s)
- **Fee** per trade: fee = notional × fee_rate_base + notional × risk_uplift(same components as spread), capped.

## Voting Power & Distribution Formulas
- W_i(t) = stake_i × delay_mult(delay_i) × age_mult(age_i, state)
- Example delay_mult caps: 1d=1.0, 7d=1.5, 30d=2.0, 90d=3.0, 365d=5.0.
- Example age_mult caps: 0–30d=1.0; 30–90d=1.1; 90–180d=1.2; 180–365d=1.3; 365+=1.5. In Dissolving: 1.0.
- W_total(t) = Σ W_i(t) across eligible positions.
- On swap of token_out, with collected fee_notional:
  - unit_accrual = fee_notional / W_total(token_out)
  - global_fee_index[token_out] += unit_accrual
  - claimable_i increases implicitly: claim_i = W_i × (index_now − last_index_i) at checkpoint/claim.

## Dissolving Mechanics
- **Split stake into two tranches when Dissolving starts**:
  - **Locked tranche**: continues earning fees; quantity declines linearly over the dissolve period.
  - **Dissolving tranche**: earns 0 fees; reserved for immediate liquidity and withdrawal scheduling.
- **Linear release schedule (hourly)**:
  - Let original_amount = A, dissolve duration = D (seconds), elapsed = e.
  - dissolving_fraction f = min(1, e/D). Locked_amount = A × (1 − f).
  - **Available_to_withdraw_now** = (A × f) − already_withdrawn.
  - If not withdrawn, the dissolving tranche remains in the pool as non-earning, immediately-usable liquidity.
- **Fee accrual while dissolving**:
  - Only the **Locked tranche** contributes to W_i and earns fees.
  - **Age bonus = 1.0** from the moment dissolving starts.
  - **Delay multiplier** during dissolving may use remaining_delay (optional). MVP: compute W_locked lazily using timestamps at interaction time.
- **No immediate full withdrawal**:
  - Users may withdraw only up to `Available_to_withdraw_now` at any time.
  - After D, 100% becomes available; still non-earning until withdrawn, serving as liquidity.

## Risk Controls
- Staleness and deviation guards: reject quotes if oracle data too old or deviates from TWAP beyond threshold.
- Per-trade notional caps; per-interval volume caps; per-token utilization caps.
- Circuit breaker to pause a token pair if volatility is extreme.

## Security Model Notes (IC canister, no on-chain EVM/SOL contracts in MVP)
- **Single-threaded canister execution**: Update calls execute atomically; we will avoid `await` between state reads/writes on critical paths (stake, quote, swap, claim, withdraw) to eliminate reentrancy-style interleavings.
- **No external contract callbacks** in MVP: EVM/SOL interactions are out of scope for MVP; later phases use threshold ECDSA to sign outbound transactions, not receive arbitrary on-chain callbacks.
- **Single source of truth**: Pool balances, voting power, and indices live in one storage layer; there are no duplicated trackers that can drift.
- **Two-phase external I/O** (for later phases): Commit state first, then perform any outbound network calls; on failure, compensating updates are explicit and idempotent.

## Implementation Stages

- **MVP (Internal Tokens only)**
  - **Add staking primitives**: `LiquidityNeuron`, `NeuronState`, multipliers, and per-token `global_fee_index`.
  - **Storage**: Stable maps for positions, per-token totals (W_total, pool balances), per-position `last_index`.
  - **Swap quoting**: Use oracle price + TWAP + dynamic spread, reject stale/deviation cases.
  - **Fees**: Base 0.1% plus risk uplift; accrue to `global_fee_index[token]`.
  - **Distribution**: Index-based accounting; `claim_fees` settles using (index_now − last_index_i) × W_i.
  - **Dissolving**: Start/Cancel Dissolving; withdraw when delay=0.
  - **Guardrails**: Notional caps, utilization caps, circuit breaker flags per token.
  - **Admin-config**: Parameters stored on-chain and editable by admin (no DAO yet).
  - **No EVM/SOL contracts**: Liquidity and accounting are purely internal tokens managed by the canister.

- **Phase 2 (Real Tokens, GMX-like safeguards)**
  - **EVM/SOL custody**: Pool wallets per chain; deposits/withdrawals mirrored to internal accounting.
  - **Gasless permits / delegations**: Reuse existing permit/delegation flows to move tokens.
  - **Wider spreads**: Offset cross-chain latency; stricter staleness thresholds; larger caps.
  - **Oracle blend**: Use TWAPs and multiple sources; chain-specific latency profiles.
  - **Emergency controls**: Pause per-token, per-chain; timelocked admin changes.
  - **Threshold ECDSA**: Outbound transactions are signed from the canister; no on-chain vault logic to reenter; all critical accounting remains in the canister.

- **Phase 3 (Governance: Liquidity DAO)**
  - **Proto-DAO (post-MVP)**: Liquidity neuron holders vote with W_i on parameter changes; timelock + guardian.
  - **Full DAO**: Separate governance canister with proposals, quorum, and role separation.

## Mapping to Current Backend
- Quote & swap path: `src/backend/src/icp/swap.rs`
  - Add quoting (bid/ask) and fee computation; use staleness/TWAP from oracle.
  - Replace canister-only liquidity with pooled staker balances for token_in/out checks.
- Types: `src/backend/src/icp/types.rs`
  - Add `LiquidityNeuron`, `NeuronState`, pool info, and config structs.
- Storage: `src/backend/src/storage.rs`
  - Stable maps: positions_by_id, positions_by_user, per-token aggregates, `global_fee_index` per token, per-position `last_index`.
- Oracle: `src/backend/src/oracle/`
  - Expose price, last_updated, and TWAP helper; track short-term vol for risk uplift.
- API surface: `src/backend/src/lib.rs`, `backend.did`
  - stake(token, amount, dissolve_delay)
  - start_dissolving(position_id), cancel_dissolving(position_id)
  - withdraw(position_id)
  - claim_fees(position_id | all)
  - get_positions(user), get_pool_info(token), get_config(), set_config(params)

## Parameter Set (initial defaults)
- fee_rate_base = 0.10% (0.001)
- s_base = 0.30%–1.00% depending on token
- k_stale, k_vol, k_depth tuned conservatively; each capped
- max_staleness_sec = e.g., 10s (internal), 2–6s for real chains with wider spread
- deviation_limit = e.g., 1.5% vs TWAP (internal), lower/higher per token liquidity
- per-trade cap: e.g., 0.5% of pool; per-minute cap: e.g., 5% pool
- utilization cap per side to avoid draining one token

## Real Tokens Path (GMX-style parallels)
- LPs collectively act as the counterparty; PnL depends on trader performance and risk controls.
- Use larger spreads and risk fees to offset oracle/latency risk.
- Consider optional hedging later (centralized or decentralized) to reduce inventory risk.
- Cross-chain orchestration: keep pool accounting in canister; custody on EVM/SOL with permits/delegations; reconcile on settlement.

## GMX Incident Learnings → Our Mitigations
- **Issue (GMX V1, Jul 2025)**: Reentrancy let attacker bypass updates in `ShortsTracker` while still updating size in `Vault`, desynchronizing AUM inputs and inflating GLP redemption value.
- **Our mitigations**:
  - **No split trackers for the same quantity**: One canonical store for pool balances, position weights, and any AUM-like aggregates. Avoid maintaining the same metric in two modules.
  - **Atomic state transitions**: Quote, fee accrual, balance debits/credits, and index updates occur within a single canister execution without `await`.
  - **No off-chain keepers in MVP**: Removes async execution ordering risks. Later, any off-chain orchestration cannot mutate state; only the canister applies state changes in atomic updates.
  - **Redemption/value calculation is index-based**: Users cannot manipulate AUM-style formulas between deposit and redemption. GLP-like mint/burn is replaced by index accrual against voting power with checkpoints.
  - **Warm-up for new stake**: New stakes begin accruing from the current `global_fee_index` (no retroactive accrual). Optional short warm-up delay for redemption to reduce deposit-then-redeem gaming.
  - **Dissolving is non-earning and linear**: Prevents instant redemption of full stake at manipulated values; only time-proportional amounts are withdrawable.
  - **Deviation and staleness guards on quotes**: Prevents inflated valuations due to stale oracle vs TWAP divergence.
  - **Per-interval mint/burn limits (Phase 2)**: Cap large stake mint/burn within a window to reduce flash-loan style swings when real tokens are introduced.

## Audit Checklist (Pre-Launch)
- **Atomicity**: No `await` or external calls on critical paths (stake, start_dissolving, withdraw, market_swap, claim_fees). External I/O happens strictly after state commit.
- **Single source of truth**: No duplicated accounting of balances/weights/AUM. If derived values exist, they are computed from canonical state each time.
- **Index math**: `global_fee_index` is monotonic; per-position `last_index` checkpoints on each mutation; claim math is non-negative and idempotent.
- **Dissolving math**: Locked tranche decreases linearly; available-to-withdraw cannot exceed elapsed schedule; non-earning tranche never contributes to W_total.
- **Quote guards**: Stale-oracle rejection, TWAP deviation limits, size/depth-based spread uplifts, per-trade and per-interval caps, utilization limits.
- **Circuit breakers**: Admin can pause individual tokens; paused tokens cannot be quoted or swapped.
- **Access control**: Only the canister mutates pool state; admin-only parameter updates; inputs validated.
- **Event logs/metrics**: Emit structured logs for quotes, fees, accruals, dissolving ticks, withdrawals, and pauses.

## Invariants (Runtime Assertions)
- **Non-negativity**: Pool balances and user balances never negative.
- **Bounded accrual**: Fee accrual per swap ≤ notional × max_fee_cap.
- **Weight conservation**: Σ W_i over active positions matches aggregates; dissolving tranches do not contribute to W_total.
- **Withdrawal bounds**: `withdrawn_total ≤ A × f(elapsed)` for each dissolving position.
- **Monotonic indices**: `global_fee_index[token]` never decreases; `last_index_i` ≤ current index.

## Open Questions for Discussion (pre-implementation)
- Should Dissolving positions continue earning at reduced power or stop entirely?
- Linear withdrawal smoothing on dissolve completion (e.g., 1–24h) vs immediate withdrawal?
- Include Dissolving positions in W_total or exclude for stronger incentive?
- Default spreads and caps per token (token-specific risk profiles)?
- Governance timelines: when to flip from admin-only to proto-DAO?

## Build Checklist (MVP)
- **Types & storage**: neurons, indexes, aggregates.
- **Admin-config and getters**.
- **Oracle TWAP/staleness utilities**.
- **Quote engine** (bid/ask) + risk fees + guardrails.
- **Swap path integration** with fee accrual.
- **Staking lifecycle**: stake → (optional) start_dissolving → withdraw; claim_fees.
- **Metrics & logs** for pricing, rejections, and accruals.

## Non-Goals (MVP)
- **No hedging layer**.
- **No full DAO** (admin-only params with audit logs and optional timelock).
- **No cross-chain custody** yet; internal tokens only.

## Notes
- This model removes AMM impermanent loss but introduces market-making risk; spreads/fees/limits defend LPs.
- The neuron-inspired design aligns incentives toward longer-term, stable liquidity.


