const { ethers } = require("hardhat");
const { Actor, HttpAgent } = require("@dfinity/agent");
const { idlFactory } = require("../../declarations/fusion_htlc_canister/fusion_htlc_canister.did.js");

/**
 * ICP Client for Etherlink HTLC Integration
 * 
 * This client handles communication between the Etherlink EVM contract
 * and the ICP canister for cross-chain HTLC operations.
 */
class ICPClient {
    constructor(canisterId, options = {}) {
        this.canisterId = canisterId;
        this.mockMode = options.mockMode || false;
        
        if (!this.mockMode) {
            // Configure agent with proper options
            const agentOptions = {
                host: options.host || "http://localhost:4943",
                ...options.agentOptions
            };
            
            this.agent = options.agent || new HttpAgent(agentOptions);
            this.actor = this.createActor();
        } else {
            console.log("🔧 ICP Client running in mock mode");
            this.actor = null;
        }
        
        this.etherlinkHTLC = null; // Will be set when contract is deployed
    }

    /**
     * Create ICP actor for canister communication
     */
    createActor() {
        // Fetch root key for certificate validation during development
        if (process.env.DFX_NETWORK !== "ic") {
            this.agent.fetchRootKey().catch((err) => {
                console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
                console.error(err);
            });
        }

        return Actor.createActor(idlFactory, {
            agent: this.agent,
            canisterId: this.canisterId,
        });
    }

    /**
     * Set the deployed Etherlink HTLC contract instance
     */
    setEtherlinkContract(contract) {
        this.etherlinkHTLC = contract;
    }

    /**
     * Convert EVM chain type to ICP chain type
     */
    convertChainType(evmChainType) {
        switch (evmChainType) {
            case "Etherlink":
            case "EtherlinkMainnet":
                return { "Base": null }; // Etherlink uses Base chain type
            case "Ethereum":
            case "EthereumMainnet":
                return { "Ethereum": null };
            case "Polygon":
            case "PolygonMainnet":
                return { "Polygon": null };
            case "Arbitrum":
            case "ArbitrumOne":
                return { "Arbitrum": null };
            case "BSC":
            case "BSCMainnet":
                return { "Ethereum": null }; // Map BSC to Ethereum for now
            default:
                return { "Ethereum": null };
        }
    }

    /**
     * Test ICP canister connectivity
     */
    async testConnectivity() {
        if (this.mockMode) {
            console.log("✅ ICP Canister connectivity test passed (mock mode)");
            return true;
        }
        
        try {
            const result = await this.actor.greet("Etherlink Integration");
            console.log("✅ ICP Canister connectivity test passed:", result);
            return true;
        } catch (error) {
            console.error("❌ ICP Canister connectivity test failed:", error);
            return false;
        }
    }

    /**
     * Test EVM RPC connectivity through ICP canister
     */
    async testEVMConnectivity(chainId) {
        try {
            const result = await this.actor.test_evm_rpc(chainId);
            if ('ok' in result) {
                console.log(`✅ EVM RPC connectivity test for chain ${chainId}:`, result.ok);
                return result.ok;
            } else {
                console.error(`❌ EVM RPC connectivity test failed for chain ${chainId}:`, result.err);
                return null;
            }
        } catch (error) {
            console.error(`❌ EVM RPC connectivity test failed for chain ${chainId}:`, error);
            return null;
        }
    }

    /**
     * Get EVM chain configuration
     */
    async getChainConfig(chainId) {
        try {
            const result = await this.actor.get_chain_config(chainId);
            if ('ok' in result) {
                console.log(`✅ Chain config for ${chainId}:`, result.ok);
                return result.ok;
            } else {
                console.error(`❌ Failed to get chain config for ${chainId}:`, result.err);
                return null;
            }
        } catch (error) {
            console.error(`❌ Error getting chain config for ${chainId}:`, error);
            return null;
        }
    }

    /**
     * Create HTLC on ICP canister
     */
    async createICPHTLC(recipient, amount, tokenCanister, expirationTime, chainType, ethereumAddress = null) {
        try {
            console.log("�� Creating HTLC on ICP canister...");
            console.log("   Recipient:", recipient);
            console.log("   Amount:", amount);
            console.log("   Token Canister:", tokenCanister);
            console.log("   Expiration:", expirationTime);
            console.log("   Chain Type:", chainType);
            console.log("   Ethereum Address:", ethereumAddress);

            // Convert string recipient to Principal if needed
            let recipientPrincipal;
            if (typeof recipient === 'string') {
                // For now, we'll use a placeholder principal
                // In a real implementation, you'd convert the address to a principal
                recipientPrincipal = recipient; // This needs to be a proper Principal
            } else {
                recipientPrincipal = recipient;
            }

            const result = await this.actor.create_htlc(
                recipientPrincipal,
                BigInt(amount),
                tokenCanister,
                BigInt(expirationTime),
                chainType,
                ethereumAddress ? [ethereumAddress] : []
            );

            if ('ok' in result) {
                console.log("✅ HTLC created on ICP:", result.ok);
                return result.ok;
            } else {
                console.error("❌ Failed to create HTLC on ICP:", result.err);
                return null;
            }
        } catch (error) {
            console.error("❌ Error creating HTLC on ICP:", error);
            return null;
        }
    }

    /**
     * Set hashlock for ICP HTLC
     */
    async setICPHTLCHashlock(htlcId, hashlock) {
        try {
            console.log("🔐 Setting hashlock for ICP HTLC:", htlcId);
            
            // Convert hex string to blob
            const hashlockBlob = ethers.utils.arrayify(hashlock);
            
            const result = await this.actor.set_htlc_hashlock(htlcId, Array.from(hashlockBlob));
            
            if ('ok' in result) {
                console.log("✅ Hashlock set successfully");
                return true;
            } else {
                console.error("❌ Failed to set hashlock:", result.err);
                return false;
            }
        } catch (error) {
            console.error("❌ Error setting hashlock:", error);
            return false;
        }
    }

    /**
     * Create HTLC on EVM chain through ICP canister
     */
    async createEVMHTLC(chainId, evmHtlcAddress, hashlock, recipient, amount, expiration) {
        try {
            console.log("🔗 Creating HTLC on EVM chain through ICP...");
            console.log("   Chain ID:", chainId);
            console.log("   EVM HTLC Address:", evmHtlcAddress);
            console.log("   Hashlock:", hashlock);
            console.log("   Recipient:", recipient);
            console.log("   Amount:", amount);
            console.log("   Expiration:", expiration);

            const result = await this.actor.create_evm_htlc(
                BigInt(chainId),
                evmHtlcAddress,
                hashlock,
                recipient,
                BigInt(amount),
                BigInt(expiration)
            );

            if ('ok' in result) {
                console.log("✅ EVM HTLC creation initiated:", result.ok);
                return result.ok;
            } else {
                console.error("❌ Failed to create EVM HTLC:", result.err);
                return null;
            }
        } catch (error) {
            console.error("❌ Error creating EVM HTLC:", error);
            return null;
        }
    }

    /**
     * Claim HTLC on EVM chain through ICP canister
     */
    async claimEVMHTLC(chainId, evmHtlcAddress, secret) {
        try {
            console.log("💰 Claiming HTLC on EVM chain through ICP...");
            console.log("   Chain ID:", chainId);
            console.log("   EVM HTLC Address:", evmHtlcAddress);
            console.log("   Secret:", secret);

            const result = await this.actor.claim_evm_htlc(
                BigInt(chainId),
                evmHtlcAddress,
                secret
            );

            if ('ok' in result) {
                console.log("✅ EVM HTLC claim initiated:", result.ok);
                return result.ok;
            } else {
                console.error("❌ Failed to claim EVM HTLC:", result.err);
                return null;
            }
        } catch (error) {
            console.error("❌ Error claiming EVM HTLC:", error);
            return null;
        }
    }

    /**
     * Refund HTLC on EVM chain through ICP canister
     */
    async refundEVMHTLC(chainId, evmHtlcAddress) {
        try {
            console.log("↩️ Refunding HTLC on EVM chain through ICP...");
            console.log("   Chain ID:", chainId);
            console.log("   EVM HTLC Address:", evmHtlcAddress);

            const result = await this.actor.refund_evm_htlc(
                BigInt(chainId),
                evmHtlcAddress
            );

            if ('ok' in result) {
                console.log("✅ EVM HTLC refund initiated:", result.ok);
                return result.ok;
            } else {
                console.error("❌ Failed to refund EVM HTLC:", result.err);
                return null;
            }
        } catch (error) {
            console.error("❌ Error refunding EVM HTLC:", error);
            return null;
        }
    }

    /**
     * Get EVM interaction details
     */
    async getEVMInteraction(interactionId) {
        try {
            const result = await this.actor.get_evm_interaction(interactionId);
            if ('ok' in result) {
                console.log("✅ EVM interaction details:", result.ok);
                return result.ok;
            } else {
                console.error("❌ Failed to get EVM interaction:", result.err);
                return null;
            }
        } catch (error) {
            console.error("❌ Error getting EVM interaction:", error);
            return null;
        }
    }

    /**
     * Get all EVM interactions for an HTLC
     */
    async getEVMInteractionsByHTLC(htlcId) {
        try {
            const interactions = await this.actor.get_evm_interactions_by_htlc(htlcId);
            console.log("✅ EVM interactions for HTLC:", interactions);
            return interactions;
        } catch (error) {
            console.error("❌ Error getting EVM interactions:", error);
            return [];
        }
    }

    /**
     * Get HTLC details from ICP canister
     */
    async getICPHTLC(htlcId) {
        try {
            const result = await this.actor.get_htlc(htlcId);
            if ('ok' in result) {
                console.log("✅ ICP HTLC details:", result.ok);
                return result.ok;
            } else {
                console.error("❌ Failed to get ICP HTLC:", result.err);
                return null;
            }
        } catch (error) {
            console.error("❌ Error getting ICP HTLC:", error);
            return null;
        }
    }

    /**
     * Link 1inch order to HTLC
     */
    async link1inchOrder(htlcId, oneinchOrder, isSourceChain, partialFillIndex = null) {
        try {
            console.log("🔗 Linking 1inch order to HTLC...");
            console.log("   HTLC ID:", htlcId);
            console.log("   Order Hash:", oneinchOrder.order_hash);
            console.log("   Is Source Chain:", isSourceChain);

            const result = await this.actor.link_1inch_order(
                htlcId,
                oneinchOrder,
                isSourceChain,
                partialFillIndex ? [BigInt(partialFillIndex)] : []
            );

            if ('ok' in result) {
                console.log("✅ 1inch order linked successfully");
                return true;
            } else {
                console.error("❌ Failed to link 1inch order:", result.err);
                return false;
            }
        } catch (error) {
            console.error("❌ Error linking 1inch order:", error);
            return false;
        }
    }

    /**
     * Get 1inch order for HTLC
     */
    async get1inchOrder(htlcId) {
        try {
            const result = await this.actor.get_1inch_order(htlcId);
            if ('ok' in result) {
                console.log("✅ 1inch order details:", result.ok);
                return result.ok;
            } else {
                console.error("❌ Failed to get 1inch order:", result.err);
                return null;
            }
        } catch (error) {
            console.error("❌ Error getting 1inch order:", error);
            return null;
        }
    }

    /**
     * Parse order secrets for HTLC claim
     */
    async parseOrderSecretsForHTLC(orderHash) {
        try {
            console.log("🔐 Parsing order secrets for HTLC claim...");
            console.log("   Order Hash:", orderHash);

            const result = await this.actor.parse_order_secrets_for_htlc(orderHash);

            if ('ok' in result) {
                console.log("✅ Order secrets parsed:", result.ok);
                return result.ok;
            } else {
                console.error("❌ Failed to parse order secrets:", result.err);
                return null;
            }
        } catch (error) {
            console.error("❌ Error parsing order secrets:", error);
            return null;
        }
    }

    /**
     * Complete cross-chain HTLC workflow
     */
    async completeCrossChainHTLC(htlcId, secret, chainId, evmHtlcAddress) {
        try {
            console.log("🔄 Completing cross-chain HTLC workflow...");
            console.log("   HTLC ID:", htlcId);
            console.log("   Chain ID:", chainId);
            console.log("   EVM HTLC Address:", evmHtlcAddress);

            // Step 1: Claim HTLC on EVM chain
            const claimResult = await this.claimEVMHTLC(chainId, evmHtlcAddress, secret);
            if (!claimResult) {
                console.error("❌ Failed to claim HTLC on EVM chain");
                return false;
            }

            // Step 2: Wait for transaction confirmation
            console.log("⏳ Waiting for EVM transaction confirmation...");
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

            // Step 3: Get interaction details
            const interaction = await this.getEVMInteraction(claimResult);
            if (!interaction) {
                console.error("❌ Failed to get interaction details");
                return false;
            }

            console.log("✅ Cross-chain HTLC workflow completed successfully");
            return true;
        } catch (error) {
            console.error("❌ Error completing cross-chain HTLC workflow:", error);
            return false;
        }
    }

    /**
     * Monitor HTLC status across chains
     */
    async monitorHTLCStatus(htlcId, chainId, evmHtlcAddress) {
        try {
            console.log("📊 Monitoring HTLC status across chains...");
            console.log("   HTLC ID:", htlcId);
            console.log("   Chain ID:", chainId);
            console.log("   EVM HTLC Address:", evmHtlcAddress);

            // Get ICP HTLC status
            const icpHtlc = await this.getICPHTLC(htlcId);
            if (icpHtlc) {
                console.log("📋 ICP HTLC Status:", icpHtlc.status);
            }

            // Get EVM interactions
            const evmInteractions = await this.getEVMInteractionsByHTLC(htlcId);
            if (evmInteractions.length > 0) {
                console.log("📋 EVM Interactions:", evmInteractions.length);
                evmInteractions.forEach((interaction, index) => {
                    console.log(`   ${index + 1}. Action: ${interaction.action}, Status: ${interaction.status}`);
                });
            }

            return {
                icp: icpHtlc,
                evm: evmInteractions
            };
        } catch (error) {
            console.error("❌ Error monitoring HTLC status:", error);
            return null;
        }
    }
}

module.exports = { ICPClient }; 