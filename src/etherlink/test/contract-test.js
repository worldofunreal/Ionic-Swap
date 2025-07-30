const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EtherlinkHTLC", function () {
    let etherlinkHTLC;
    let owner;
    let user1;
    let user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();
        
        const EtherlinkHTLC = await ethers.getContractFactory("EtherlinkHTLC");
        etherlinkHTLC = await EtherlinkHTLC.deploy(owner.address);
        await etherlinkHTLC.deployed();
    });

    describe("Deployment", function () {
        it("Should deploy successfully", async function () {
            expect(etherlinkHTLC.address).to.not.equal(ethers.constants.AddressZero);
        });

        it("Should set the correct owner", async function () {
            expect(await etherlinkHTLC.owner()).to.equal(owner.address);
        });

        it("Should set the correct ICP network signer", async function () {
            expect(await etherlinkHTLC.icpNetworkSigner()).to.equal(owner.address);
        });
    });

    describe("HTLC Creation", function () {
        it("Should create ETH HTLC successfully", async function () {
            const recipient = user2.address;
            const hashlock = ethers.utils.keccak256(ethers.utils.randomBytes(32));
            const timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
            const amount = ethers.utils.parseEther("0.1");

            await expect(
                etherlinkHTLC.createHTLCETH(
                    recipient,
                    hashlock,
                    timelock,
                    1, // ICP
                    2, // Etherlink
                    true, // isCrossChain
                    "", // orderHash
                    { value: amount }
                )
            ).to.not.be.reverted;
        });

        it("Should fail to create HTLC with zero amount", async function () {
            const recipient = user2.address;
            const hashlock = ethers.utils.keccak256(ethers.utils.randomBytes(32));
            const timelock = Math.floor(Date.now() / 1000) + 3600;

            await expect(
                etherlinkHTLC.createHTLCETH(
                    recipient,
                    hashlock,
                    timelock,
                    1, // ICP
                    2, // Etherlink
                    true, // isCrossChain
                    "", // orderHash
                    { value: 0 }
                )
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("Should fail to create HTLC with past timelock", async function () {
            const recipient = user2.address;
            const hashlock = ethers.utils.keccak256(ethers.utils.randomBytes(32));
            const timelock = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
            const amount = ethers.utils.parseEther("0.1");

            await expect(
                etherlinkHTLC.createHTLCETH(
                    recipient,
                    hashlock,
                    timelock,
                    1, // ICP
                    2, // Etherlink
                    true, // isCrossChain
                    "", // orderHash
                    { value: amount }
                )
            ).to.be.revertedWith("Timelock must be in the future");
        });
    });

    describe("HTLC Operations", function () {
        let htlcId;
        let secret;
        let hashlock;
        let recipient;
        let timelock;
        let amount;

        beforeEach(async function () {
            recipient = user2.address;
            secret = ethers.utils.randomBytes(32);
            hashlock = ethers.utils.keccak256(secret);
            timelock = Math.floor(Date.now() / 1000) + 3600;
            amount = ethers.utils.parseEther("0.1");

            const tx = await etherlinkHTLC.createHTLCETH(
                recipient,
                hashlock,
                timelock,
                1, // ICP
                2, // Etherlink
                true, // isCrossChain
                "", // orderHash
                { value: amount }
            );

            const receipt = await tx.wait();
            const event = receipt.events?.find(e => e.event === "HTLCCreated");
            htlcId = event.args.htlcId;
        });

        it("Should allow recipient to claim HTLC with correct secret", async function () {
            const secretString = ethers.utils.hexlify(secret);
            
            await expect(
                etherlinkHTLC.connect(user2).claimHTLC(htlcId, secretString)
            ).to.not.be.reverted;
        });

        it("Should fail to claim HTLC with wrong secret", async function () {
            const wrongSecret = ethers.utils.randomBytes(32);
            const wrongSecretString = ethers.utils.hexlify(wrongSecret);
            
            await expect(
                etherlinkHTLC.connect(user2).claimHTLC(htlcId, wrongSecretString)
            ).to.be.revertedWith("Invalid secret");
        });

        it("Should fail to claim HTLC by non-recipient", async function () {
            const secretString = ethers.utils.hexlify(secret);
            
            await expect(
                etherlinkHTLC.connect(user1).claimHTLC(htlcId, secretString)
            ).to.be.revertedWith("Only HTLC recipient can perform this action");
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to update fees", async function () {
            const newClaimFee = ethers.utils.parseEther("0.002"); // 0.2%
            const newRefundFee = ethers.utils.parseEther("0.001"); // 0.1%

            await expect(
                etherlinkHTLC.updateFees(newClaimFee, newRefundFee)
            ).to.not.be.reverted;

            expect(await etherlinkHTLC.claimFee()).to.equal(newClaimFee);
            expect(await etherlinkHTLC.refundFee()).to.equal(newRefundFee);
        });

        it("Should fail to update fees by non-owner", async function () {
            const newClaimFee = ethers.utils.parseEther("0.002");
            const newRefundFee = ethers.utils.parseEther("0.001");

            await expect(
                etherlinkHTLC.connect(user1).updateFees(newClaimFee, newRefundFee)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should allow owner to update ICP signer", async function () {
            const newSigner = user1.address;

            await expect(
                etherlinkHTLC.updateICPSigner(newSigner)
            ).to.not.be.reverted;

            expect(await etherlinkHTLC.icpNetworkSigner()).to.equal(newSigner);
        });
    });
}); 