const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EtherlinkHTLC", function () {
    let EtherlinkHTLC;
    let etherlinkHTLC;
    let owner;
    let sender;
    let recipient;
    let maker;
    let taker;
    let icpNetworkSigner;
    let addr1;
    let addr2;
    let mockToken;

    // Test constants
    const swapAmount = ethers.utils.parseEther("1.0");
    const secret = "my_secret_123";
    const hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));
    const orderHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const remoteHtlcId = "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321";

    beforeEach(async function () {
        // Get signers
        [owner, sender, recipient, maker, taker, icpNetworkSigner, addr1, addr2] = await ethers.getSigners();

        // Deploy the contract
        EtherlinkHTLC = await ethers.getContractFactory("EtherlinkHTLC");
        etherlinkHTLC = await EtherlinkHTLC.deploy(icpNetworkSigner.address);
        await etherlinkHTLC.deployed();

        // Deploy mock ERC20 token for testing
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy("Mock Token", "MTK");
        await mockToken.deployed();

        // Mint some tokens to sender for testing
        await mockToken.mint(sender.address, ethers.utils.parseEther("1000"));
    });

    describe("Deployment", function () {
        it("Should set the correct ICP network signer", async function () {
            expect(await etherlinkHTLC.icpNetworkSigner()).to.equal(icpNetworkSigner.address);
        });

        it("Should set the correct owner", async function () {
            expect(await etherlinkHTLC.owner()).to.equal(owner.address);
        });

        it("Should initialize counters to zero", async function () {
            expect((await etherlinkHTLC.htlcCounter()).toNumber()).to.equal(0);
            expect((await etherlinkHTLC.crossChainSwapCounter()).toNumber()).to.equal(0);
        });

        it("Should set correct initial fees", async function () {
            expect(await etherlinkHTLC.claimFee()).to.equal(ethers.utils.parseEther("0.001")); // 0.1%
            expect(await etherlinkHTLC.refundFee()).to.equal(ethers.utils.parseEther("0.0005")); // 0.05%
        });
    });

    describe("ETH HTLC Functions", function () {
        let timelock;

        beforeEach(async function () {
            timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        });

        describe("createHTLCETH", function () {
            it("Should create an ETH HTLC successfully", async function () {
                const tx = await etherlinkHTLC.connect(sender).createHTLCETH(
                    recipient.address,
                    hashlock,
                    timelock,
                    0, // Etherlink
                    1, // ICP
                    true, // isCrossChain
                    orderHash,
                    { value: swapAmount }
                );

                await tx.wait();

                // Verify HTLC was created
                expect((await etherlinkHTLC.htlcCounter()).toNumber()).to.equal(1);
                
                // Get user HTLCs to verify creation
                const userHTLCs = await etherlinkHTLC.getUserHTLCs(sender.address);
                expect(userHTLCs.length).to.equal(1);

                // Verify HTLC details
                const htlcId = userHTLCs[0];
                const htlc = await etherlinkHTLC.getHTLC(htlcId);
                expect(htlc.sender).to.equal(sender.address);
                expect(htlc.recipient).to.equal(recipient.address);
                expect(htlc.amount).to.equal(swapAmount);
                expect(htlc.hashlock).to.equal(hashlock);
                expect(htlc.timelock).to.equal(timelock);
                expect(htlc.status).to.equal(0); // Locked
                expect(htlc.token).to.equal(ethers.constants.AddressZero);
                expect(htlc.sourceChain).to.equal(0); // Etherlink
                expect(htlc.targetChain).to.equal(1); // ICP
                expect(htlc.isCrossChain).to.be.true;
                expect(htlc.orderHash).to.equal(orderHash);
            });

            it("Should fail with invalid recipient address", async function () {
                await expect(
                    etherlinkHTLC.connect(sender).createHTLCETH(
                        ethers.constants.AddressZero,
                        hashlock,
                        timelock,
                        0, 1, true, orderHash,
                        { value: swapAmount }
                    )
                ).to.be.revertedWith("Invalid recipient address");
            });

            it("Should fail with zero amount", async function () {
                await expect(
                    etherlinkHTLC.connect(sender).createHTLCETH(
                        recipient.address,
                        hashlock,
                        timelock,
                        0, 1, true, orderHash,
                        { value: 0 }
                    )
                ).to.be.revertedWith("Amount must be greater than 0");
            });

            it("Should fail with past timelock", async function () {
                const pastTimelock = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
                await expect(
                    etherlinkHTLC.connect(sender).createHTLCETH(
                        recipient.address,
                        hashlock,
                        pastTimelock,
                        0, 1, true, orderHash,
                        { value: swapAmount }
                    )
                ).to.be.revertedWith("Timelock must be in the future");
            });

            it("Should fail with zero hashlock", async function () {
                await expect(
                    etherlinkHTLC.connect(sender).createHTLCETH(
                        recipient.address,
                        ethers.constants.HashZero,
                        timelock,
                        0, 1, true, orderHash,
                        { value: swapAmount }
                    )
                ).to.be.revertedWith("Invalid hashlock");
            });
        });

        describe("claimHTLC", function () {
            let htlcId;

            beforeEach(async function () {
                // Create HTLC first
                const tx = await etherlinkHTLC.connect(sender).createHTLCETH(
                    recipient.address,
                    hashlock,
                    timelock,
                    0, 1, true, orderHash,
                    { value: swapAmount }
                );
                await tx.wait();

                const userHTLCs = await etherlinkHTLC.getUserHTLCs(sender.address);
                htlcId = userHTLCs[0];
            });

            it("Should claim ETH HTLC with valid secret", async function () {
                const initialBalance = await recipient.getBalance();
                const claimFee = swapAmount.mul(ethers.utils.parseEther("0.001")).div(ethers.utils.parseEther("1"));
                const expectedAmount = swapAmount.sub(claimFee);

                const tx = await etherlinkHTLC.connect(recipient).claimHTLC(htlcId, secret);
                await tx.wait();

                // Verify HTLC was claimed
                const htlc = await etherlinkHTLC.getHTLC(htlcId);
                expect(htlc.status).to.equal(1); // Claimed
                expect(htlc.secret).to.equal(secret);

                // Verify ETH was transferred
                const finalBalance = await recipient.getBalance();
                expect(finalBalance.sub(initialBalance)).to.be.closeTo(
                    expectedAmount,
                    ethers.utils.parseEther("0.01") // Allow for gas costs
                );
            });

            it("Should fail if caller is not recipient", async function () {
                await expect(
                    etherlinkHTLC.connect(addr1).claimHTLC(htlcId, secret)
                ).to.be.revertedWith("Only HTLC recipient can perform this action");
            });

            it("Should fail with invalid secret", async function () {
                await expect(
                    etherlinkHTLC.connect(recipient).claimHTLC(htlcId, "wrong_secret")
                ).to.be.revertedWith("Invalid secret");
            });

            it("Should fail if HTLC is already claimed", async function () {
                // Claim first time
                await etherlinkHTLC.connect(recipient).claimHTLC(htlcId, secret);

                // Try to claim again
                await expect(
                    etherlinkHTLC.connect(recipient).claimHTLC(htlcId, secret)
                ).to.be.revertedWith("HTLC is not in locked state");
            });
        });

        describe("refundHTLC", function () {
            let htlcId;

            beforeEach(async function () {
                // Create HTLC with short timelock
                const shortTimelock = Math.floor(Date.now() / 1000) + 1; // 1 second from now
                const tx = await etherlinkHTLC.connect(sender).createHTLCETH(
                    recipient.address,
                    hashlock,
                    shortTimelock,
                    0, 1, true, orderHash,
                    { value: swapAmount }
                );
                await tx.wait();

                const userHTLCs = await etherlinkHTLC.getUserHTLCs(sender.address);
                htlcId = userHTLCs[0];

                // Wait for timelock to expire
                await ethers.provider.send("evm_increaseTime", [2]);
                await ethers.provider.send("evm_mine");
            });

            it("Should refund expired ETH HTLC", async function () {
                const initialBalance = await sender.getBalance();
                const refundFee = swapAmount.mul(ethers.utils.parseEther("0.0005")).div(ethers.utils.parseEther("1"));
                const expectedAmount = swapAmount.sub(refundFee);

                const tx = await etherlinkHTLC.connect(sender).refundHTLC(htlcId);
                await tx.wait();

                // Verify HTLC was refunded
                const htlc = await etherlinkHTLC.getHTLC(htlcId);
                expect(htlc.status).to.equal(2); // Refunded

                // Verify ETH was returned
                const finalBalance = await sender.getBalance();
                expect(finalBalance.sub(initialBalance)).to.be.closeTo(
                    expectedAmount,
                    ethers.utils.parseEther("0.01") // Allow for gas costs
                );
            });

            it("Should fail if caller is not sender", async function () {
                await expect(
                    etherlinkHTLC.connect(addr1).refundHTLC(htlcId)
                ).to.be.revertedWith("Only HTLC sender can perform this action");
            });

            it("Should fail if HTLC has not expired", async function () {
                // Create HTLC with long timelock
                const longTimelock = Math.floor(Date.now() / 1000) + 3600;
                const tx = await etherlinkHTLC.connect(sender).createHTLCETH(
                    recipient.address,
                    hashlock,
                    longTimelock,
                    0, 1, true, orderHash,
                    { value: swapAmount }
                );
                await tx.wait();

                const userHTLCs = await etherlinkHTLC.getUserHTLCs(sender.address);
                const newHtlcId = userHTLCs[1];

                await expect(
                    etherlinkHTLC.connect(sender).refundHTLC(newHtlcId)
                ).to.be.revertedWith("HTLC has not expired yet");
            });
        });
    });

    describe("ERC20 HTLC Functions", function () {
        let timelock;

        beforeEach(async function () {
            timelock = Math.floor(Date.now() / 1000) + 3600;
            
            // Approve tokens for contract
            await mockToken.connect(sender).approve(etherlinkHTLC.address, swapAmount);
        });

        describe("createHTLCERC20", function () {
            it("Should create an ERC20 HTLC successfully", async function () {
                const tx = await etherlinkHTLC.connect(sender).createHTLCERC20(
                    recipient.address,
                    mockToken.address,
                    swapAmount,
                    hashlock,
                    timelock,
                    0, // Etherlink
                    1, // ICP
                    true, // isCrossChain
                    orderHash
                );

                await tx.wait();

                // Verify HTLC was created
                expect((await etherlinkHTLC.htlcCounter()).toNumber()).to.equal(1);
                
                // Verify tokens were transferred to contract
                expect(await mockToken.balanceOf(etherlinkHTLC.address)).to.equal(swapAmount);
                expect(await mockToken.balanceOf(sender.address)).to.equal(ethers.utils.parseEther("999"));

                // Verify HTLC details
                const userHTLCs = await etherlinkHTLC.getUserHTLCs(sender.address);
                const htlcId = userHTLCs[0];
                const htlc = await etherlinkHTLC.getHTLC(htlcId);
                expect(htlc.token).to.equal(mockToken.address);
                expect(htlc.amount).to.equal(swapAmount);
            });

            it("Should fail with invalid token address", async function () {
                await expect(
                    etherlinkHTLC.connect(sender).createHTLCERC20(
                        recipient.address,
                        ethers.constants.AddressZero,
                        swapAmount,
                        hashlock,
                        timelock,
                        0, 1, true, orderHash
                    )
                ).to.be.revertedWith("Invalid token address");
            });
        });

        describe("claimHTLC (ERC20)", function () {
            let htlcId;

            beforeEach(async function () {
                // Create ERC20 HTLC
                const tx = await etherlinkHTLC.connect(sender).createHTLCERC20(
                    recipient.address,
                    mockToken.address,
                    swapAmount,
                    hashlock,
                    timelock,
                    0, 1, true, orderHash
                );
                await tx.wait();

                const userHTLCs = await etherlinkHTLC.getUserHTLCs(sender.address);
                htlcId = userHTLCs[0];
            });

            it("Should claim ERC20 HTLC with valid secret", async function () {
                const initialBalance = await mockToken.balanceOf(recipient.address);
                const claimFee = swapAmount.mul(ethers.utils.parseEther("0.001")).div(ethers.utils.parseEther("1"));
                const expectedAmount = swapAmount.sub(claimFee);

                const tx = await etherlinkHTLC.connect(recipient).claimHTLC(htlcId, secret);
                await tx.wait();

                // Verify HTLC was claimed
                const htlc = await etherlinkHTLC.getHTLC(htlcId);
                expect(htlc.status).to.equal(1); // Claimed

                // Verify tokens were transferred
                const finalBalance = await mockToken.balanceOf(recipient.address);
                expect(finalBalance.sub(initialBalance)).to.equal(expectedAmount);
            });
        });
    });

    describe("Cross-Chain Swap Functions", function () {
        let timelock;

        beforeEach(async function () {
            timelock = Math.floor(Date.now() / 1000) + 3600;
        });

        describe("createCrossChainSwap", function () {
            it("Should create a cross-chain swap successfully", async function () {
                const tx = await etherlinkHTLC.connect(maker).createCrossChainSwap(
                    taker.address,
                    swapAmount,
                    hashlock,
                    timelock,
                    1, // ICP target chain
                    orderHash,
                    remoteHtlcId,
                    { value: swapAmount }
                );

                await tx.wait();

                // Verify swap was created
                expect((await etherlinkHTLC.crossChainSwapCounter()).toNumber()).to.equal(1);
                
                // Get user cross-chain swaps
                const userSwaps = await etherlinkHTLC.getUserCrossChainSwaps(maker.address);
                expect(userSwaps.length).to.equal(1);

                // Verify swap details
                const swapId = userSwaps[0];
                const swap = await etherlinkHTLC.getCrossChainSwap(swapId);
                expect(swap.maker).to.equal(maker.address);
                expect(swap.taker).to.equal(taker.address);
                expect(swap.amount).to.equal(swapAmount);
                expect(swap.hashlock).to.equal(hashlock);
                expect(swap.timelock).to.equal(timelock);
                expect(swap.claimed).to.be.false;
                expect(swap.refunded).to.be.false;
                expect(swap.sourceChain).to.equal(0); // Etherlink
                expect(swap.targetChain).to.equal(1); // ICP
                expect(swap.orderHash).to.equal(orderHash);
                expect(swap.remoteHtlcId).to.equal(remoteHtlcId);
            });

            it("Should fail with invalid taker address", async function () {
                await expect(
                    etherlinkHTLC.connect(maker).createCrossChainSwap(
                        ethers.constants.AddressZero,
                        swapAmount,
                        hashlock,
                        timelock,
                        1, orderHash, remoteHtlcId,
                        { value: swapAmount }
                    )
                ).to.be.revertedWith("Invalid taker address");
            });

            it("Should fail with empty order hash", async function () {
                await expect(
                    etherlinkHTLC.connect(maker).createCrossChainSwap(
                        taker.address,
                        swapAmount,
                        hashlock,
                        timelock,
                        1, "", remoteHtlcId,
                        { value: swapAmount }
                    )
                ).to.be.revertedWith("Order hash is required");
            });
        });

        describe("completeCrossChainSwap", function () {
            let swapId;

            beforeEach(async function () {
                // Create cross-chain swap
                const tx = await etherlinkHTLC.connect(maker).createCrossChainSwap(
                    taker.address,
                    swapAmount,
                    hashlock,
                    timelock,
                    1, orderHash, remoteHtlcId,
                    { value: swapAmount }
                );
                await tx.wait();

                const userSwaps = await etherlinkHTLC.getUserCrossChainSwaps(maker.address);
                swapId = userSwaps[0];
            });

            it("Should complete cross-chain swap with valid secret", async function () {
                const tx = await etherlinkHTLC.connect(taker).completeCrossChainSwap(swapId, secret);
                await tx.wait();

                // Verify swap was completed
                const swap = await etherlinkHTLC.getCrossChainSwap(swapId);
                expect(swap.claimed).to.be.true;
            });

            it("Should fail if caller is not taker", async function () {
                await expect(
                    etherlinkHTLC.connect(addr1).completeCrossChainSwap(swapId, secret)
                ).to.be.revertedWith("Only taker can complete the swap");
            });

            it("Should fail with invalid secret", async function () {
                await expect(
                    etherlinkHTLC.connect(taker).completeCrossChainSwap(swapId, "wrong_secret")
                ).to.be.revertedWith("Invalid secret");
            });

            it("Should fail if swap has expired", async function () {
                // Wait for timelock to expire
                await ethers.provider.send("evm_increaseTime", [3601]);
                await ethers.provider.send("evm_mine");

                await expect(
                    etherlinkHTLC.connect(taker).completeCrossChainSwap(swapId, secret)
                ).to.be.revertedWith("Swap has expired");
            });
        });
    });

    describe("Query Functions", function () {
        let htlcId;
        let swapId;

        beforeEach(async function () {
            const timelock = Math.floor(Date.now() / 1000) + 3600;

            // Create HTLC
            const htlcTx = await etherlinkHTLC.connect(sender).createHTLCETH(
                recipient.address,
                hashlock,
                timelock,
                0, 1, true, orderHash,
                { value: swapAmount }
            );
            await htlcTx.wait();

            const userHTLCs = await etherlinkHTLC.getUserHTLCs(sender.address);
            htlcId = userHTLCs[0];

            // Create cross-chain swap
            const swapTx = await etherlinkHTLC.connect(maker).createCrossChainSwap(
                taker.address,
                swapAmount,
                hashlock,
                timelock,
                1, orderHash, remoteHtlcId,
                { value: swapAmount }
            );
            await swapTx.wait();

            const userSwaps = await etherlinkHTLC.getUserCrossChainSwaps(maker.address);
            swapId = userSwaps[0];
        });

        it("Should get HTLC by order hash", async function () {
            const retrievedHtlcId = await etherlinkHTLC.getHTLCByOrderHash(orderHash);
            expect(retrievedHtlcId).to.equal(swapId); // Should return the cross-chain swap ID
        });

        it("Should get user HTLCs", async function () {
            const userHTLCs = await etherlinkHTLC.getUserHTLCs(sender.address);
            expect(userHTLCs.length).to.equal(1);
            expect(userHTLCs[0]).to.equal(htlcId);
        });

        it("Should get user cross-chain swaps", async function () {
            const userSwaps = await etherlinkHTLC.getUserCrossChainSwaps(maker.address);
            expect(userSwaps.length).to.equal(1);
            expect(userSwaps[0]).to.equal(swapId);
        });
    });

    describe("Admin Functions", function () {
        it("Should update fees", async function () {
            const newClaimFee = ethers.utils.parseEther("0.002"); // 0.2%
            const newRefundFee = ethers.utils.parseEther("0.001"); // 0.1%

            const tx = await etherlinkHTLC.connect(owner).updateFees(newClaimFee, newRefundFee);
            await tx.wait();

            expect(await etherlinkHTLC.claimFee()).to.equal(newClaimFee);
            expect(await etherlinkHTLC.refundFee()).to.equal(newRefundFee);
        });

        it("Should fail to update fees if not owner", async function () {
            const newClaimFee = ethers.utils.parseEther("0.002");
            const newRefundFee = ethers.utils.parseEther("0.001");

            await expect(
                etherlinkHTLC.connect(addr1).updateFees(newClaimFee, newRefundFee)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should fail to update fees if too high", async function () {
            const highClaimFee = ethers.utils.parseEther("0.02"); // 2%
            const highRefundFee = ethers.utils.parseEther("0.01"); // 1%

            await expect(
                etherlinkHTLC.connect(owner).updateFees(highClaimFee, highRefundFee)
            ).to.be.revertedWith("Claim fee too high");
        });

        it("Should update ICP network signer", async function () {
            const newSigner = addr1.address;
            const tx = await etherlinkHTLC.connect(owner).updateICPSigner(newSigner);
            await tx.wait();

            expect(await etherlinkHTLC.icpNetworkSigner()).to.equal(newSigner);
        });

        it("Should fail to update ICP signer if not owner", async function () {
            await expect(
                etherlinkHTLC.connect(addr1).updateICPSigner(addr2.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should fail to update ICP signer with zero address", async function () {
            await expect(
                etherlinkHTLC.connect(owner).updateICPSigner(ethers.constants.AddressZero)
            ).to.be.revertedWith("Invalid signer address");
        });

        it("Should pause and unpause contract", async function () {
            // Pause
            await etherlinkHTLC.connect(owner).pause();
            expect(await etherlinkHTLC.paused()).to.be.true;

            // Unpause
            await etherlinkHTLC.connect(owner).unpause();
            expect(await etherlinkHTLC.paused()).to.be.false;
        });

        it("Should fail to create HTLC when paused", async function () {
            await etherlinkHTLC.connect(owner).pause();

            const timelock = Math.floor(Date.now() / 1000) + 3600;
            await expect(
                etherlinkHTLC.connect(sender).createHTLCETH(
                    recipient.address,
                    hashlock,
                    timelock,
                    0, 1, true, orderHash,
                    { value: swapAmount }
                )
            ).to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Fee Collection", function () {
        let htlcId;

        beforeEach(async function () {
            const timelock = Math.floor(Date.now() / 1000) + 3600;

            // Create and claim HTLC to generate fees
            const createTx = await etherlinkHTLC.connect(sender).createHTLCETH(
                recipient.address,
                hashlock,
                timelock,
                0, 1, true, orderHash,
                { value: swapAmount }
            );
            await createTx.wait();

            const userHTLCs = await etherlinkHTLC.getUserHTLCs(sender.address);
            htlcId = userHTLCs[0];

            const claimTx = await etherlinkHTLC.connect(recipient).claimHTLC(htlcId, secret);
            await claimTx.wait();
        });

        it("Should collect fees correctly", async function () {
            const expectedFees = swapAmount.mul(ethers.utils.parseEther("0.001")).div(ethers.utils.parseEther("1"));
            expect(await etherlinkHTLC.totalFeesCollected()).to.equal(expectedFees);
        });

        it("Should allow owner to withdraw fees", async function () {
            const initialBalance = await owner.getBalance();
            const fees = await etherlinkHTLC.totalFeesCollected();

            const tx = await etherlinkHTLC.connect(owner).withdrawFees();
            await tx.wait();

            const finalBalance = await owner.getBalance();
            expect(finalBalance.sub(initialBalance)).to.be.closeTo(
                fees,
                ethers.utils.parseEther("0.01") // Allow for gas costs
            );

            expect(await etherlinkHTLC.totalFeesCollected()).to.equal(0);
        });

        it("Should fail to withdraw fees if not owner", async function () {
            await expect(
                etherlinkHTLC.connect(addr1).withdrawFees()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow emergency withdrawal of ETH", async function () {
            // Send some ETH to contract
            await owner.sendTransaction({
                to: etherlinkHTLC.address,
                value: ethers.utils.parseEther("1.0")
            });

            const initialBalance = await owner.getBalance();
            const withdrawalAmount = ethers.utils.parseEther("0.5");

            const tx = await etherlinkHTLC.connect(owner).emergencyWithdraw(
                ethers.constants.AddressZero,
                withdrawalAmount
            );
            await tx.wait();

            const finalBalance = await owner.getBalance();
            expect(finalBalance.sub(initialBalance)).to.be.closeTo(
                withdrawalAmount,
                ethers.utils.parseEther("0.01") // Allow for gas costs
            );
        });

        it("Should allow emergency withdrawal of ERC20 tokens", async function () {
            // Transfer tokens to contract
            await mockToken.transfer(etherlinkHTLC.address, swapAmount);

            const initialBalance = await owner.getBalance();
            const withdrawalAmount = swapAmount.div(2);

            const tx = await etherlinkHTLC.connect(owner).emergencyWithdraw(
                mockToken.address,
                withdrawalAmount
            );
            await tx.wait();

            expect(await mockToken.balanceOf(owner.address)).to.equal(withdrawalAmount);
        });

        it("Should fail emergency withdrawal if not owner", async function () {
            await expect(
                etherlinkHTLC.connect(addr1).emergencyWithdraw(
                    ethers.constants.AddressZero,
                    ethers.utils.parseEther("1.0")
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Events", function () {
        it("Should emit HTLCCreated event", async function () {
            const timelock = Math.floor(Date.now() / 1000) + 3600;

            await expect(
                etherlinkHTLC.connect(sender).createHTLCETH(
                    recipient.address,
                    hashlock,
                    timelock,
                    0, 1, true, orderHash,
                    { value: swapAmount }
                )
            ).to.emit(etherlinkHTLC, "HTLCCreated")
             .withArgs(
                 ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(
                     ["address", "address", "uint256", "bytes32", "uint256", "uint256", "uint256"],
                     [sender.address, recipient.address, swapAmount, hashlock, timelock, await ethers.provider.getBlock("latest").then(b => b.timestamp), 0]
                 )),
                 sender.address,
                 recipient.address,
                 swapAmount,
                 hashlock,
                 timelock,
                 ethers.constants.AddressZero,
                 0, // Etherlink
                 1, // ICP
                 true // isCrossChain
             );
        });

        it("Should emit HTLCClaimed event", async function () {
            const timelock = Math.floor(Date.now() / 1000) + 3600;

            // Create HTLC
            const createTx = await etherlinkHTLC.connect(sender).createHTLCETH(
                recipient.address,
                hashlock,
                timelock,
                0, 1, true, orderHash,
                { value: swapAmount }
            );
            await createTx.wait();

            const userHTLCs = await etherlinkHTLC.getUserHTLCs(sender.address);
            const htlcId = userHTLCs[0];

            const claimFee = swapAmount.mul(ethers.utils.parseEther("0.001")).div(ethers.utils.parseEther("1"));
            const expectedAmount = swapAmount.sub(claimFee);

            await expect(
                etherlinkHTLC.connect(recipient).claimHTLC(htlcId, secret)
            ).to.emit(etherlinkHTLC, "HTLCClaimed")
             .withArgs(htlcId, recipient.address, secret, expectedAmount);
        });
    });
}); 