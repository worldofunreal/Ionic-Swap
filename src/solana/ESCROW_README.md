# Ionic Solana Escrow Program

A thin PDA vault program for the "Reserve → Execute → Settle" architecture, enabling secure cross-chain token transfers with TSS (Threshold Signature Scheme) verification.

## Architecture Overview

The escrow program implements a hybrid design where:
- **ICP Orchestrator** acts as the intent matcher and coordinator
- **Solana Escrow** provides thin PDA vaults per order
- **TSS Signatures** from ICP authorize token releases
- **Partial Fills** are supported through nonce-based releases

## Core Functions

### 1. Reserve
Creates a new escrow order and reserves tokens in a PDA vault.

```rust
pub fn reserve(
    ctx: Context<Reserve>,
    order_id: [u8; 32],
    amount: u64,
    expiry: i64,
) -> Result<()>
```

**Features:**
- Creates deterministic PDA vault per order
- Transfers tokens from user to escrow PDA
- Sets expiry timestamp
- Emits ReserveEvent

### 2. Release
Releases tokens from escrow to recipient, gated by TSS signature.

```rust
pub fn release(
    ctx: Context<Release>,
    order_id: [u8; 32],
    amount: u64,
    fill_nonce: u64,
    dst_chain_id: u64,
    dst_tx_hash: [u8; 32],
    tss_signature: [u8; 64],
    recovery_id: u8,
) -> Result<()>
```

**Features:**
- Verifies TSS signature from ICP orchestrator
- Supports partial fills with nonce-based replay protection
- Transfers tokens to recipient
- Updates remaining amount
- Emits ReleaseEvent

### 3. Refund
Refunds remaining tokens to owner after expiry or by owner request.

```rust
pub fn refund(ctx: Context<Refund>, order_id: [u8; 32]) -> Result<()>
```

**Features:**
- Can be called by owner anytime
- Can be called by anyone after expiry
- Transfers remaining tokens back to owner
- Emits RefundEvent

### 4. Initialize TSS Authority
Sets up the TSS public key for signature verification.

```rust
pub fn initialize_tss_authority(
    ctx: Context<InitializeTSS>,
    tss_public_key: [u8; 64],
) -> Result<()>
```

## Security Features

### Replay Protection
- Each release uses a unique `fill_nonce`
- Nonces are stored in the escrow account
- Duplicate nonces are rejected

### TSS Signature Verification
- Uses secp256k1 signature recovery
- Verifies signature against stored TSS public key
- Message includes all relevant parameters

### Expiry Protection
- Orders have configurable expiry timestamps
- Expired orders can be refunded by anyone
- Prevents indefinite token locks

### PDA Security
- Escrow accounts use deterministic seeds
- Token accounts are owned by escrow PDAs
- No private keys needed for escrow operations

## Order Lifecycle

```
1. Create Order (ICP)
   ↓
2. Reserve Tokens (Solana)
   ↓
3. Execute Trade (Destination Chain)
   ↓
4. Release Tokens (Solana) [Repeatable for partial fills]
   ↓
5. Complete/Refund (Solana)
```

## Usage Examples

### Deploy the Program
```bash
npm run deploy:escrow devnet
```

### Test the Program
```bash
npm run test:escrow devnet
```

### Initialize TSS Authority
```javascript
const tssPublicKey = new Uint8Array(64); // From ICP orchestrator
await program.methods
  .initializeTssAuthority(tssPublicKey)
  .accounts({
    tssConfig: tssConfigPDA,
    admin: adminKeypair.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([adminKeypair])
  .rpc();
```

### Reserve Tokens
```javascript
const orderId = new Uint8Array(32); // Unique order identifier
const amount = new BN(100 * 10**6); // 100 tokens
const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour

await program.methods
  .reserve(orderId, amount, new BN(expiry))
  .accounts({
    escrowAccount: escrowPDA,
    escrowTokenAccount: escrowTokenPDA,
    owner: userKeypair.publicKey,
    tokenMint: tokenMint,
    userTokenAccount: userTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .signers([userKeypair])
  .rpc();
```

### Release Tokens
```javascript
const tssSignature = new Uint8Array(64); // From ICP orchestrator
const recoveryId = 0; // From signature recovery

await program.methods
  .release(
    orderId,
    releaseAmount,
    fillNonce,
    dstChainId,
    dstTxHash,
    tssSignature,
    recoveryId
  )
  .accounts({
    escrowAccount: escrowPDA,
    escrowTokenAccount: escrowTokenPDA,
    recipient: recipientKeypair.publicKey,
    recipientTokenAccount: recipientTokenAccount,
    tssAuthority: tssConfigPDA,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([recipientKeypair])
  .rpc();
```

## Integration with ICP

The Solana escrow program integrates with the ICP orchestrator through:

1. **TSS Signature Verification**: ICP signs release messages with threshold signatures
2. **Order Coordination**: ICP tracks order states and coordinates releases
3. **Cross-Chain Proofs**: ICP validates destination chain transactions
4. **Partial Fill Management**: ICP manages fill nonces and remaining amounts

## Error Handling

The program includes comprehensive error handling:

- `InvalidOrderId`: Order ID mismatch
- `InvalidStatus`: Incorrect order status
- `InsufficientAmount`: Not enough tokens to release
- `Expired`: Order has expired
- `NonceAlreadyUsed`: Replay attack detected
- `InvalidSignature`: TSS signature verification failed
- `InvalidTSSAuthority`: TSS public key mismatch
- `UnauthorizedRefund`: Refund not authorized
- `NoAmountToRefund`: Nothing to refund

## Events

The program emits events for all major operations:

- `ReserveEvent`: Tokens reserved in escrow
- `ReleaseEvent`: Tokens released from escrow
- `RefundEvent`: Tokens refunded to owner
- `TSSInitializedEvent`: TSS authority initialized

## Testing

Run the test suite to verify functionality:

```bash
npm run test:escrow devnet
```

The test suite covers:
- TSS authority initialization
- Token reservation
- Token release with signature verification
- Token refund scenarios
- Partial fill support
- Expiry handling

## Deployment

Deploy to different networks:

```bash
# Devnet
npm run deploy:escrow devnet

# Testnet
npm run deploy:escrow testnet

# Mainnet
npm run deploy:escrow mainnet
```

## Security Considerations

1. **TSS Key Management**: Ensure TSS public key is properly initialized
2. **Signature Verification**: Always verify TSS signatures before releases
3. **Nonce Management**: Use unique nonces for each release
4. **Expiry Handling**: Monitor and handle expired orders
5. **PDA Security**: Verify PDA derivations are correct

## Future Enhancements

- [ ] Batch releases for gas efficiency
- [ ] Multi-token support
- [ ] Dynamic fee structures
- [ ] Advanced order types
- [ ] Integration with DEX aggregators
