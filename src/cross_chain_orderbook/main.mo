import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Error "mo:base/Error";
import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Iter "mo:base/Iter";
import ICRC1 "mo:icrc1-mo/ICRC1";
import ICRC2 "mo:icrc2-mo/ICRC2";

shared actor class CrossChainOrderbook() = this {
    
    // Types
    type OrderId = Text;
    type SwapId = Text;
    type TokenAddress = Text;
    type Amount = Nat;
    type Timestamp = Int;
    type Secret = Blob;
    type HashedSecret = Text;
    type Signature = Blob;
    
    // Order status
    type OrderStatus = {
        #Open;
        #Matched;
        #Cancelled;
        #Expired;
    };
    
    // Swap status
    type SwapStatus = {
        #Pending;
        #Locked;
        #Completed;
        #Refunded;
        #Expired;
    };
    
    // Limit order structure
    type LimitOrder = {
        orderId: OrderId;
        owner: Principal;
        tokenSell: TokenAddress;
        amountSell: Amount;
        tokenBuy: TokenAddress;
        amountBuy: Amount;
        hashedSecret: HashedSecret;
        timestamp: Timestamp;
        isEvmUser: Bool;
        status: OrderStatus;
    };
    
    // HTLC state structure
    type HtlcState = {
        swapId: SwapId;
        initiator: Principal;
        counterparty: Principal;
        hashedSecret: HashedSecret;
        timelock: Timestamp;
        status: SwapStatus;
        createdAt: Timestamp;
    };
    
    // Error types
    type OrderError = {
        #OrderNotFound;
        #OrderAlreadyMatched;
        #OrderExpired;
        #InvalidAmount;
        #InvalidSignature;
        #InsufficientFunds;
        #SwapNotFound;
        #InvalidSecret;
        #TimelockExpired;
        #Unauthorized;
    };
    
    // State
    private stable var orderCounter: Nat = 0;
    private stable var swapCounter: Nat = 0;
    
    // Order book - stores open limit orders
    private var orderBook = HashMap.HashMap<OrderId, LimitOrder>(0, Text.equal, Text.hash);
    
    // Active swaps - stores HTLC states
    private var activeSwaps = HashMap.HashMap<SwapId, HtlcState>(0, Text.equal, Text.hash);
    
    // User orders mapping
    private var userOrders = HashMap.HashMap<Principal, [OrderId]>(0, Principal.equal, Principal.hash);
    
    // Token canister reference
    private var tokenCanister: ?Principal = null;
    
    // System functions
    system func preupgrade() {
        // Save state before upgrade
    };
    
    system func postupgrade() {
        // Restore state after upgrade
    };
    
    // Helper functions
    private func generateOrderId(): OrderId {
        orderCounter += 1;
        return "order_" # Nat.toText(orderCounter);
    };
    
    private func generateSwapId(): SwapId {
        swapCounter += 1;
        return "swap_" # Nat.toText(swapCounter);
    };
    
    private func getCurrentTime(): Timestamp {
        return Time.now();
    };
    
    // EIP-712 signature verification (placeholder - needs implementation)
    private func verifyEvmSignature(order: LimitOrder, signature: Signature): Bool {
        // TODO: Implement EIP-712 signature verification
        // This will need to verify the signature against the order data
        return true; // Placeholder
    };
    
    // Token transfer helper functions
    private func transferTokensFrom(owner: Principal, _spender: Principal, to: Principal, amount: Amount, memo: ?[Nat8]): async Result.Result<(), OrderError> {
        let tokenCanisterId = switch (tokenCanister) {
            case (?id) id;
            case null return #err(#InsufficientFunds); // Token canister not set
        };
        let tokenActor = actor(Principal.toText(tokenCanisterId)) : actor {
            icrc2_transfer_from : ICRC2.TransferFromArgs -> async ICRC2.TransferFromResponse;
        };
        let memoBlob : ?Blob = switch memo { case null null; case (?m) ?Blob.fromArray(m) };
        let transferFromArgs: ICRC2.TransferFromArgs = {
            from = { owner = owner; subaccount = null };
            to = { owner = to; subaccount = null };
            spender_subaccount = null;
            amount = amount;
            fee = null;
            memo = null;
            created_at_time = null;
        };
        switch (await tokenActor.icrc2_transfer_from(transferFromArgs)) {
            case (#Ok(_)) { #ok(()) };
            case (#Err(_)) { #err(#InsufficientFunds) };
        };
    };
    
    private func lockTokens(user: Principal, amount: Amount, orderId: OrderId): async Result.Result<(), OrderError> {
        let memo = Text.encodeUtf8("Lock for order: " # orderId);
        await transferTokensFrom(user, Principal.fromActor(this), Principal.fromActor(this), amount, ?Blob.toArray(memo));
    };
    
    private func unlockTokens(to: Principal, amount: Amount, swapId: SwapId): async Result.Result<(), OrderError> {
        let memo = Text.encodeUtf8("Unlock for swap: " # swapId);
        await transferTokensFrom(Principal.fromActor(this), Principal.fromActor(this), to, amount, ?Blob.toArray(memo));
    };
    
    // Public methods
    
    // Place an order from an ICP user
    public shared({caller}) func placeIcpOrder(
        tokenSell: TokenAddress,
        amountSell: Amount,
        tokenBuy: TokenAddress,
        amountBuy: Amount,
        hashedSecret: HashedSecret
    ): async Result.Result<OrderId, OrderError> {
        
        // Validate inputs
        if (amountSell == 0 or amountBuy == 0) {
            return #err(#InvalidAmount);
        };
        
        let orderId = generateOrderId();
        let currentTime = getCurrentTime();
        
        let order: LimitOrder = {
            orderId = orderId;
            owner = caller;
            tokenSell = tokenSell;
            amountSell = amountSell;
            tokenBuy = tokenBuy;
            amountBuy = amountBuy;
            hashedSecret = hashedSecret;
            timestamp = currentTime;
            isEvmUser = false;
            status = #Open;
        };
        
        // Lock ICP tokens in HTLC state
        switch (await lockTokens(caller, amountSell, orderId)) {
            case (#ok(_)) { };
            case (#err(err)) { return #err(err) };
        };
        
        // Add order to order book
        orderBook.put(orderId, order);
        
        // Add to user's orders
        let userOrderIds = switch (userOrders.get(caller)) {
            case (?existing) { Array.append(existing, [orderId]) };
            case null { [orderId] };
        };
        userOrders.put(caller, userOrderIds);
        
        #ok(orderId)
    };
    
    // Submit an order from an EVM user
    public shared({caller}) func submitEvmOrder(
        tokenSell: TokenAddress,
        amountSell: Amount,
        tokenBuy: TokenAddress,
        amountBuy: Amount,
        hashedSecret: HashedSecret,
        signature: Signature
    ): async Result.Result<OrderId, OrderError> {
        
        // Validate inputs
        if (amountSell == 0 or amountBuy == 0) {
            return #err(#InvalidAmount);
        };
        
        // Create order structure for signature verification
        let order: LimitOrder = {
            orderId = ""; // Will be set after verification
            owner = caller;
            tokenSell = tokenSell;
            amountSell = amountSell;
            tokenBuy = tokenBuy;
            amountBuy = amountBuy;
            hashedSecret = hashedSecret;
            timestamp = getCurrentTime();
            isEvmUser = true;
            status = #Open;
        };
        
        // Verify signature
        if (not verifyEvmSignature(order, signature)) {
            return #err(#InvalidSignature);
        };
        
        let orderId = generateOrderId();
        let currentTime = getCurrentTime();
        
        let finalOrder: LimitOrder = {
            orderId = orderId;
            owner = caller;
            tokenSell = tokenSell;
            amountSell = amountSell;
            tokenBuy = tokenBuy;
            amountBuy = amountBuy;
            hashedSecret = hashedSecret;
            timestamp = currentTime;
            isEvmUser = true;
            status = #Open;
        };
        
        // Add order to order book
        orderBook.put(orderId, finalOrder);
        
        // Add to user's orders
        let userOrderIds = switch (userOrders.get(caller)) {
            case (?existing) { Array.append(existing, [orderId]) };
            case null { [orderId] };
        };
        userOrders.put(caller, userOrderIds);
        
        #ok(orderId)
    };
    
    // Take an existing order
    public shared({caller}) func takeOrder(orderId: OrderId): async Result.Result<SwapId, OrderError> {
        
        let order = switch (orderBook.get(orderId)) {
            case (?o) o;
            case null return #err(#OrderNotFound);
        };
        
        // Check if order is still open
        if (order.status != #Open) {
            return #err(#OrderAlreadyMatched);
        };
        
        // Check if caller is not the order owner
        if (order.owner == caller) {
            return #err(#Unauthorized);
        };
        
        let swapId = generateSwapId();
        let currentTime = getCurrentTime();
        let timelock = currentTime + 3600_000_000_000; // 1 hour timelock
        
        let htlcState: HtlcState = {
            swapId = swapId;
            initiator = order.owner;
            counterparty = caller;
            hashedSecret = order.hashedSecret;
            timelock = timelock;
            status = #Pending;
            createdAt = currentTime;
        };
        
        // Update order status
        let updatedOrder: LimitOrder = {
            orderId = order.orderId;
            owner = order.owner;
            tokenSell = order.tokenSell;
            amountSell = order.amountSell;
            tokenBuy = order.tokenBuy;
            amountBuy = order.amountBuy;
            hashedSecret = order.hashedSecret;
            timestamp = order.timestamp;
            isEvmUser = order.isEvmUser;
            status = #Matched;
        };
        
        orderBook.put(orderId, updatedOrder);
        activeSwaps.put(swapId, htlcState);
        
        #ok(swapId)
    };
    
    // Claim funds with secret
    public shared({caller}) func claimFunds(swapId: SwapId, secret: Secret): async Result.Result<(), OrderError> {
        
        let swap = switch (activeSwaps.get(swapId)) {
            case (?s) s;
            case null return #err(#SwapNotFound);
        };
        
        // Check if caller is authorized
        if (swap.initiator != caller and swap.counterparty != caller) {
            return #err(#Unauthorized);
        };
        
        // TODO: Verify secret matches hashed secret
        // This will require hashing the secret and comparing with swap.hashedSecret
        
        // Get the original order to find the token amounts
        let order = switch (orderBook.get(swapId)) {
            case (?o) o;
            case null return #err(#OrderNotFound);
        };
        
        // Transfer funds to caller (either initiator or counterparty)
        let amountToTransfer = if (caller == swap.initiator) {
            order.amountBuy // Initiator gets the buy amount
        } else {
            order.amountSell // Counterparty gets the sell amount
        };
        
        switch (await unlockTokens(caller, amountToTransfer, swapId)) {
            case (#ok(_)) { };
            case (#err(err)) { return #err(err) };
        };
        
        // Update swap status
        let updatedSwap: HtlcState = {
            swapId = swap.swapId;
            initiator = swap.initiator;
            counterparty = swap.counterparty;
            hashedSecret = swap.hashedSecret;
            timelock = swap.timelock;
            status = #Completed;
            createdAt = swap.createdAt;
        };
        
        activeSwaps.put(swapId, updatedSwap);
        
        #ok(())
    };
    
    // Refund funds from expired swap
    public shared({caller}) func refundFunds(swapId: SwapId): async Result.Result<(), OrderError> {
        
        let swap = switch (activeSwaps.get(swapId)) {
            case (?s) s;
            case null return #err(#SwapNotFound);
        };
        
        let currentTime = getCurrentTime();
        
        // Check if timelock has expired
        if (currentTime < swap.timelock) {
            return #err(#TimelockExpired);
        };
        
        // Check if caller is the initiator
        if (swap.initiator != caller) {
            return #err(#Unauthorized);
        };
        
        // Get the original order to find the token amounts
        let order = switch (orderBook.get(swapId)) {
            case (?o) o;
            case null return #err(#OrderNotFound);
        };
        
        // Transfer funds back to initiator
        switch (await unlockTokens(swap.initiator, order.amountSell, swapId)) {
            case (#ok(_)) { };
            case (#err(err)) { return #err(err) };
        };
        
        // Update swap status
        let updatedSwap: HtlcState = {
            swapId = swap.swapId;
            initiator = swap.initiator;
            counterparty = swap.counterparty;
            hashedSecret = swap.hashedSecret;
            timelock = swap.timelock;
            status = #Refunded;
            createdAt = swap.createdAt;
        };
        
        activeSwaps.put(swapId, updatedSwap);
        
        #ok(())
    };
    
    // Cancel an open order
    public shared({caller}) func cancelOrder(orderId: OrderId): async Result.Result<(), OrderError> {
        
        let order = switch (orderBook.get(orderId)) {
            case (?o) o;
            case null return #err(#OrderNotFound);
        };
        
        // Check if caller is the order owner
        if (order.owner != caller) {
            return #err(#Unauthorized);
        };
        
        // Check if order is still open
        if (order.status != #Open) {
            return #err(#OrderAlreadyMatched);
        };
        
        // Return locked funds to owner
        switch (await unlockTokens(order.owner, order.amountSell, orderId)) {
            case (#ok(_)) { };
            case (#err(err)) { return #err(err) };
        };
        
        // Update order status
        let updatedOrder: LimitOrder = {
            orderId = order.orderId;
            owner = order.owner;
            tokenSell = order.tokenSell;
            amountSell = order.amountSell;
            tokenBuy = order.tokenBuy;
            amountBuy = order.amountBuy;
            hashedSecret = order.hashedSecret;
            timestamp = order.timestamp;
            isEvmUser = order.isEvmUser;
            status = #Cancelled;
        };
        
        orderBook.put(orderId, updatedOrder);
        
        #ok(())
    };
    
    // Query methods
    
    // Get all open orders
    public query func getOpenOrders(): async [LimitOrder] {
        let buffer = Buffer.Buffer<LimitOrder>(0);
        for ((_, order) in orderBook.entries()) {
            if (order.status == #Open) {
                buffer.add(order);
            };
        };
        Buffer.toArray(buffer)
    };
    
    // Get order by ID
    public query func getOrder(orderId: OrderId): async ?LimitOrder {
        orderBook.get(orderId)
    };
    
    // Get swap by ID
    public query func getSwap(swapId: SwapId): async ?HtlcState {
        activeSwaps.get(swapId)
    };
    
    // Get user's orders
    public query func getUserOrders(user: Principal): async [LimitOrder] {
        let userOrderIds = switch (userOrders.get(user)) {
            case (?ids) ids;
            case null { [] };
        };
        
        let buffer = Buffer.Buffer<LimitOrder>(0);
        for (orderId in userOrderIds.vals()) {
            switch (orderBook.get(orderId)) {
                case (?order) { buffer.add(order) };
                case null { };
            };
        };
        Buffer.toArray(buffer)
    };
    
    // Get active swaps
    public query func getActiveSwaps(): async [HtlcState] {
        let buffer = Buffer.Buffer<HtlcState>(0);
        for ((_, swap) in activeSwaps.entries()) {
            buffer.add(swap);
        };
        Buffer.toArray(buffer)
    };
    
    // Admin functions
    
    // Set the token canister ID
    public shared({caller}) func setTokenCanister(canisterId: Principal): async Result.Result<(), OrderError> {
        // TODO: Add proper authorization check
        tokenCanister := ?canisterId;
        #ok(())
    };
    
    // Get the current token canister ID
    public query func getTokenCanister(): async ?Principal {
        tokenCanister
    };
}; 