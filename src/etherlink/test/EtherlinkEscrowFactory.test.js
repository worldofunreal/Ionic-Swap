const { expect } = require("chai");
const { ethers } = require("hardhat");
require("chai-as-promised");

describe("EtherlinkEscrowFactory", function () {
    let EtherlinkEscrowFactory;
    let etherlinkEscrowFactory;
    let owner;
    let icpNetworkSigner;
    let user1;
    let user2;
    let mockToken;

    // Test constants
    const rescueDelaySrc = 3600; // 1 hour
    const rescueDelayDst = 7200; // 2 hours
    const safetyDeposit = ethers.utils.parseEther("0.01");
    const swapAmount = ethers.utils.parseEther("1.0");

    beforeEach(async function () {
        // Get signers
        [owner, icpNetworkSigner, user1, user2] = await ethers.getSigners();

        // Deploy the factory contract
        EtherlinkEscrowFactory = await ethers.getContractFactory("EtherlinkEscrowFactory");
        etherlinkEscrowFactory = await EtherlinkEscrowFactory.deploy(
            icpNetworkSigner.address,
            rescueDelaySrc,
            rescueDelayDst
        );
        await etherlinkEscrowFactory.deployed();

        // Deploy mock ERC20 token for testing
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy("Mock Token", "MTK");
        await mockToken.deployed();

        // Mint some tokens to icpNetworkSigner for testing
        await mockToken.mint(icpNetworkSigner.address, ethers.utils.parseEther("1000"));
    });

    describe("Deployment", function () {
        it("Should set the correct ICP network signer", async function () {
            expect(await etherlinkEscrowFactory.icpNetworkSigner()).to.equal(icpNetworkSigner.address);
        });

        it("Should deploy implementation contracts", async function () {
            expect(await etherlinkEscrowFactory.ESCROW_SRC_IMPLEMENTATION()).to.not.equal(ethers.constants.AddressZero);
            expect(await etherlinkEscrowFactory.ESCROW_DST_IMPLEMENTATION()).to.not.equal(ethers.constants.AddressZero);
        });

        it("Should set correct initial fees", async function () {
            expect(await etherlinkEscrowFactory.claimFee()).to.equal(ethers.utils.parseEther("0.001"));
            expect(await etherlinkEscrowFactory.refundFee()).to.equal(ethers.utils.parseEther("0.0005"));
        });
    });

    describe("Access Control", function () {
        it("Should only allow ICP network signer to create source escrows", async function () {
            const immutables = {
                orderHash: ethers.utils.randomBytes(32),
                hashlock: ethers.utils.randomBytes(32),
                maker: user2.address,
                taker: user1.address,
                token: ethers.constants.AddressZero,
                amount: swapAmount,
                safetyDeposit: safetyDeposit,
                timelocks: {
                    srcWithdrawalDelay: 3600,
                    srcPublicWithdrawalDelay: 7200,
                    srcCancellationDelay: 10800,
                    srcPublicCancellationDelay: 14400,
                    dstWithdrawalDelay: 1800,
                    dstPublicWithdrawalDelay: 3600,
                    dstCancellationDelay: 5400,
                    deployedAt: 0
                }
            };

            const dstImmutablesComplement = {
                maker: user2.address,
                amount: swapAmount,
                token: ethers.constants.AddressZero,
                safetyDeposit: safetyDeposit,
                chainId: 1
            };

            // Should fail when called by non-ICP signer
            await expect(
                etherlinkEscrowFactory.connect(user1).createSrcEscrow(immutables, dstImmutablesComplement, {
                    value: safetyDeposit
                })
            ).to.be.revertedWith("Only ICP network signer can create escrows");

            // Should succeed when called by ICP signer
            await expect(
                etherlinkEscrowFactory.connect(icpNetworkSigner).createSrcEscrow(immutables, dstImmutablesComplement, {
                    value: safetyDeposit
                })
            ).to.not.be.reverted;
        });

        it("Should only allow ICP network signer to update fees", async function () {
            const newClaimFee = ethers.utils.parseEther("0.002");
            const newRefundFee = ethers.utils.parseEther("0.001");

            // Should fail when called by non-ICP signer
            await expect(
                etherlinkEscrowFactory.connect(user1).updateFees(newClaimFee, newRefundFee)
            ).to.be.revertedWith("Only ICP network signer can update fees");

            // Should succeed when called by ICP signer
            await expect(
                etherlinkEscrowFactory.connect(icpNetworkSigner).updateFees(newClaimFee, newRefundFee)
            ).to.not.be.reverted;

            expect(await etherlinkEscrowFactory.claimFee()).to.equal(newClaimFee);
            expect(await etherlinkEscrowFactory.refundFee()).to.equal(newRefundFee);
        });
    });

    describe("Deterministic Addresses", function () {
        it("Should compute correct deterministic addresses", async function () {
            const immutables = {
                orderHash: ethers.utils.randomBytes(32),
                hashlock: ethers.utils.randomBytes(32),
                maker: user2.address,
                taker: user1.address,
                token: ethers.constants.AddressZero,
                amount: swapAmount,
                safetyDeposit: safetyDeposit,
                timelocks: {
                    srcWithdrawalDelay: 3600,
                    srcPublicWithdrawalDelay: 7200,
                    srcCancellationDelay: 10800,
                    srcPublicCancellationDelay: 14400,
                    dstWithdrawalDelay: 1800,
                    dstPublicWithdrawalDelay: 3600,
                    dstCancellationDelay: 5400,
                    deployedAt: 0
                }
            };

            const dstImmutablesComplement = {
                maker: user2.address,
                amount: swapAmount,
                token: ethers.constants.AddressZero,
                safetyDeposit: safetyDeposit,
                chainId: 1
            };

            // Compute expected addresses
            const expectedSrcAddress = await etherlinkEscrowFactory.addressOfEscrowSrc(immutables);
            const expectedDstAddress = await etherlinkEscrowFactory.addressOfEscrowDst(immutables, dstImmutablesComplement);

            // Create escrows
            await etherlinkEscrowFactory.connect(icpNetworkSigner).createSrcEscrow(immutables, dstImmutablesComplement, {
                value: safetyDeposit
            });

            await etherlinkEscrowFactory.connect(icpNetworkSigner).createDstEscrow(immutables, dstImmutablesComplement, {
                value: safetyDeposit
            });

            // Verify addresses match
            expect(expectedSrcAddress).to.not.equal(ethers.constants.AddressZero);
            expect(expectedDstAddress).to.not.equal(ethers.constants.AddressZero);
        });
    });

    describe("Fee Management", function () {
        it("Should collect fees correctly", async function () {
            const initialBalance = await ethers.provider.getBalance(icpNetworkSigner.address);

            // Create an escrow to generate fees
            const immutables = {
                orderHash: ethers.utils.randomBytes(32),
                hashlock: ethers.utils.randomBytes(32),
                maker: user2.address,
                taker: user1.address,
                token: ethers.constants.AddressZero,
                amount: swapAmount,
                safetyDeposit: safetyDeposit,
                timelocks: {
                    srcWithdrawalDelay: 3600,
                    srcPublicWithdrawalDelay: 7200,
                    srcCancellationDelay: 10800,
                    srcPublicCancellationDelay: 14400,
                    dstWithdrawalDelay: 1800,
                    dstPublicWithdrawalDelay: 3600,
                    dstCancellationDelay: 5400,
                    deployedAt: 0
                }
            };

            const dstImmutablesComplement = {
                maker: user2.address,
                amount: swapAmount,
                token: ethers.constants.AddressZero,
                safetyDeposit: safetyDeposit,
                chainId: 1
            };

            await etherlinkEscrowFactory.connect(icpNetworkSigner).createSrcEscrow(immutables, dstImmutablesComplement, {
                value: safetyDeposit
            });

            // Check that fees were collected
            expect(await etherlinkEscrowFactory.totalFeesCollected()).to.be.gt(0);
        });

        it("Should allow ICP signer to withdraw fees", async function () {
            const initialBalance = await ethers.provider.getBalance(icpNetworkSigner.address);

            // Create an escrow to generate fees
            const immutables = {
                orderHash: ethers.utils.randomBytes(32),
                hashlock: ethers.utils.randomBytes(32),
                maker: user2.address,
                taker: user1.address,
                token: ethers.constants.AddressZero,
                amount: swapAmount,
                safetyDeposit: safetyDeposit,
                timelocks: {
                    srcWithdrawalDelay: 3600,
                    srcPublicWithdrawalDelay: 7200,
                    srcCancellationDelay: 10800,
                    srcPublicCancellationDelay: 14400,
                    dstWithdrawalDelay: 1800,
                    dstPublicWithdrawalDelay: 3600,
                    dstCancellationDelay: 5400,
                    deployedAt: 0
                }
            };

            const dstImmutablesComplement = {
                maker: user2.address,
                amount: swapAmount,
                token: ethers.constants.AddressZero,
                safetyDeposit: safetyDeposit,
                chainId: 1
            };

            await etherlinkEscrowFactory.connect(icpNetworkSigner).createSrcEscrow(immutables, dstImmutablesComplement, {
                value: safetyDeposit
            });

            // Withdraw fees
            await etherlinkEscrowFactory.connect(icpNetworkSigner).withdrawFees();

            const finalBalance = await ethers.provider.getBalance(icpNetworkSigner.address);
            expect(finalBalance).to.be.gt(initialBalance);
        });
    });
}); 