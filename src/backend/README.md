# Minimal Solana Transaction Signer Canister

A minimal Internet Computer canister for signing Solana transactions. This canister provides the essential functionality for:

- Deriving Solana addresses from IC principals
- Signing Solana transaction messages
- Sending SOL transfers
- Creating transaction messages for external signing

## Features

- **Address Derivation**: Derive Solana addresses from IC principals using Ed25519 key derivation
- **Transaction Signing**: Sign Solana transaction messages using IC's Ed25519 signing capabilities
- **SOL Transfers**: Send SOL from derived addresses to any Solana address
- **Message Creation**: Create transaction messages that can be signed externally

## API Methods

### `solana_account(owner?: Principal) -> string`
Returns the Solana address derived from a principal. If no owner is provided, uses the caller's principal.

### `get_balance(account?: string) -> nat`
Returns the SOL balance of a given account in lamports. If no account is provided, uses the caller's derived address.

### `send_sol(owner?: Principal, to: string, amount: nat) -> string`
Sends SOL from a principal's derived address to a recipient address. Returns the transaction ID.

### `sign_transaction(owner?: Principal, message_bytes: vec nat8) -> string`
Signs a serialized Solana message and returns the signature as a string.

### `create_transfer_message(owner?: Principal, to: string, amount: nat) -> vec nat8`
Creates a transfer instruction and returns the serialized message bytes for external signing.

## Usage

1. Deploy the canister:
```bash
dfx deploy minimal_solana_signer
```

2. Get your Solana address:
```bash
dfx canister call minimal_solana_signer solana_account
```

3. Check balance:
```bash
dfx canister call minimal_solana_signer get_balance
```

4. Send SOL:
```bash
dfx canister call minimal_solana_signer send_sol '(opt null, "RECIPIENT_ADDRESS", 1000000000)'
```

## Configuration

The canister is configured to use:
- **Network**: Solana Devnet (configurable)
- **Ed25519 Key**: MainnetTestKey1 (for testing)
- **SOL RPC Canister**: tghme-zyaaa-aaaar-qarca-cai

## Dependencies

This minimal canister uses the same Solana SDK dependencies as the full Solana RPC canister but with a simplified interface focused only on transaction signing capabilities.
