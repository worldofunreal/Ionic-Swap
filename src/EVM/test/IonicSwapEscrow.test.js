const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IonicSwapEscrow", function () {
  let IonicSwapEscrow;
  let ionicSwapEscrow;
  let owner;
  let sender;
  let recipient;
  let maker;
  let taker;
  let icpNetworkSigner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get signers
    [owner, sender, recipient, maker, taker, icpNetworkSigner, addr1, addr2] = await ethers.getSigners();

    // Deploy the contract
    IonicSwapEscrow = await ethers.getContractFactory("IonicSwapEscrow");
    ionicSwapEscrow = await IonicSwapEscrow.deploy(icpNetworkSigner.address);
    await ionicSwapEscrow.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct ICP network signer", async function () {
      expect(await ionicSwapEscrow.icpNetworkSigner()).to.equal(icpNetworkSigner.address);
    });

    it("Should set the correct owner", async function () {
      expect(await ionicSwapEscrow.owner()).to.equal(owner.address);
    });

    it("Should initialize counters to zero", async function () {
      expect((await ionicSwapEscrow.htlcCounter()).toNumber()).to.equal(0);
      expect((await ionicSwapEscrow.crossChainSwapCounter()).toNumber()).to.equal(0);
    });
  });

  describe("Basic HTLC Functions", function () {
    const swapAmount = ethers.utils.parseEther("1.0");
    const secret = "my_secret_123";
    const hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));
    let timelock;

    beforeEach(async function () {
      timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    });

    describe("ETH HTLC", function () {
      it("Should create an ETH HTLC successfully", async function () {
        const tx = await ionicSwapEscrow.connect(sender).createHTLCETH(
          recipient.address,
          hashlock,
          timelock,
          { value: swapAmount }
        );

        // Wait for transaction to be mined
        await tx.wait();

        // Verify HTLC was created by checking counter
        expect((await ionicSwapEscrow.htlcCounter()).toNumber()).to.equal(1);
        
        // Get user HTLCs to verify creation
        const userHTLCs = await ionicSwapEscrow.getUserHTLCs(sender.address);
        expect(userHTLCs.length).to.equal(1);
      });

      it("Should withdraw ETH HTLC with valid secret", async function () {
        // Create HTLC
        await ionicSwapEscrow.connect(sender).createHTLCETH(
          recipient.address,
          hashlock,
          timelock,
          { value: swapAmount }
        );

        // Get the HTLC ID from user HTLCs
        const userHTLCs = await ionicSwapEscrow.getUserHTLCs(sender.address);
        const htlcId = userHTLCs[0];
        
        const initialBalance = await recipient.getBalance();

        // Withdraw HTLC
        const tx = await ionicSwapEscrow.connect(recipient).withdrawHTLC(
          htlcId,
          secret,
          ethers.constants.AddressZero
        );

        await tx.wait();

        // Verify HTLC was withdrawn
        const htlc = await ionicSwapEscrow.getHTLC(htlcId);
        expect(htlc.withdrawn).to.be.true;
        expect(htlc.secret).to.equal(secret);

        // Verify ETH was transferred (account for gas costs)
        const finalBalance = await recipient.getBalance();
        expect(finalBalance.gt(initialBalance)).to.be.true;
      });

      it("Should refund expired ETH HTLC", async function () {
        // Create HTLC with short timelock
        const currentTime = Math.floor(Date.now() / 1000);
        const shortTimelock = currentTime + 1; // 1 second from now
        await ionicSwapEscrow.connect(sender).createHTLCETH(
          recipient.address,
          hashlock,
          shortTimelock,
          { value: swapAmount }
        );

        // Get the HTLC ID
        const userHTLCs = await ionicSwapEscrow.getUserHTLCs(sender.address);
        const htlcId = userHTLCs[0];
        
        const initialBalance = await sender.getBalance();

        // Wait for expiration
        await ethers.provider.send("evm_increaseTime", [2]);
        await ethers.provider.send("evm_mine");

        // Refund HTLC
        const tx = await ionicSwapEscrow.connect(sender).refundHTLC(
          htlcId,
          ethers.constants.AddressZero
        );

        await tx.wait();

        // Verify HTLC was refunded
        const htlc = await ionicSwapEscrow.getHTLC(htlcId);
        expect(htlc.refunded).to.be.true;

        // Verify ETH was refunded (account for gas costs)
        const finalBalance = await sender.getBalance();
        expect(finalBalance.gt(initialBalance)).to.be.true;
      });
    });
  });

  describe("Cross-Chain Swap Functions", function () {
    const swapAmount = ethers.utils.parseEther("1.0");
    const secret = "my_secret_123";
    const hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));
    const oneInchOrderHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    let timelock;

    beforeEach(async function () {
      timelock = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    });

    it("Should create a cross-chain ETH swap successfully", async function () {
      const tx = await ionicSwapEscrow.connect(maker).createCrossChainSwapETH(
        taker.address,
        hashlock,
        timelock,
        oneInchOrderHash,
        { value: swapAmount }
      );

      await tx.wait();

      // Verify swap was created by checking counter
      expect((await ionicSwapEscrow.crossChainSwapCounter()).toNumber()).to.equal(1);
      
      // Get user swaps to verify creation
      const userSwaps = await ionicSwapEscrow.getUserCrossChainSwaps(maker.address);
      expect(userSwaps.length).to.equal(1);

      // Verify 1inch order linking
      const linkedSwapId = await ionicSwapEscrow.getSwapFromOneInchOrder(oneInchOrderHash);
      expect(linkedSwapId).to.equal(userSwaps[0]);
    });

    it("Should claim cross-chain swap with valid Chain-Key signature", async function () {
      // Create cross-chain swap
      await ionicSwapEscrow.connect(maker).createCrossChainSwapETH(
        taker.address,
        hashlock,
        timelock,
        oneInchOrderHash,
        { value: swapAmount }
      );

      // Get the swap ID
      const userSwaps = await ionicSwapEscrow.getUserCrossChainSwaps(maker.address);
      const swapId = userSwaps[0];
      
      const icpProof = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ICP_PROOF"));
      
      // Create a valid signature from the ICP network signer
      const messageHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["bytes32", "bytes32", "string"],
          [swapId, icpProof, "ICP_LOCK_VERIFICATION"]
        )
      );
      
      const signature = await icpNetworkSigner.signMessage(ethers.utils.arrayify(messageHash));
      
      const initialBalance = await taker.getBalance();

      // Claim the swap
      const tx = await ionicSwapEscrow.connect(taker).claimCrossChainSwap(
        swapId,
        secret,
        icpProof,
        signature
      );

      await tx.wait();

      // Verify swap was claimed
      const swap = await ionicSwapEscrow.getCrossChainSwap(swapId);
      expect(swap.claimed).to.be.true;
      expect(swap.secret).to.equal(secret);
      expect(swap.icpProof).to.equal(icpProof);

      // Verify ETH was transferred (account for gas costs)
      const finalBalance = await taker.getBalance();
      expect(finalBalance.gt(initialBalance)).to.be.true;
    });

    it("Should reject claim with invalid Chain-Key signature", async function () {
      // Create cross-chain swap
      await ionicSwapEscrow.connect(maker).createCrossChainSwapETH(
        taker.address,
        hashlock,
        timelock,
        oneInchOrderHash,
        { value: swapAmount }
      );

      // Get the swap ID
      const userSwaps = await ionicSwapEscrow.getUserCrossChainSwaps(maker.address);
      const swapId = userSwaps[0];
      
      const icpProof = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ICP_PROOF"));
      
      // Create an invalid signature from a different signer
      const signature = await addr1.signMessage(ethers.utils.arrayify(icpProof));
      
      // This should fail
      try {
        await ionicSwapEscrow.connect(taker).claimCrossChainSwap(
          swapId,
          secret,
          icpProof,
          signature
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Invalid ICP proof");
      }
    });
  });

  describe("Chain-Key Signature Verification", function () {
    it("Should verify valid Chain-Key signature", async function () {
      const swapId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_swap_id"));
      const icpProof = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ICP_PROOF"));
      
      // Create a valid signature from the ICP network signer
      const messageHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["bytes32", "bytes32", "string"],
          [swapId, icpProof, "ICP_LOCK_VERIFICATION"]
        )
      );
      
      const signature = await icpNetworkSigner.signMessage(ethers.utils.arrayify(messageHash));
      
      // Verify the signature
      const isValid = await ionicSwapEscrow.verifyICPProof(swapId, icpProof, signature);
      expect(isValid).to.be.true;
    });

    it("Should reject invalid signature", async function () {
      const swapId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_swap_id"));
      const icpProof = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ICP_PROOF"));
      
      // Create an invalid signature from a different signer
      const signature = await addr1.signMessage(ethers.utils.arrayify(icpProof));
      
      // Verify the signature should fail
      const isValid = await ionicSwapEscrow.verifyICPProof(swapId, icpProof, signature);
      expect(isValid).to.be.false;
    });
  });

  describe("Query Functions", function () {
    it("Should return user HTLCs", async function () {
      const swapAmount = ethers.utils.parseEther("1.0");
      const secret = "my_secret_123";
      const hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));
      const timelock = Math.floor(Date.now() / 1000) + 3600;

      // Create HTLC
      await ionicSwapEscrow.connect(sender).createHTLCETH(
        recipient.address,
        hashlock,
        timelock,
        { value: swapAmount }
      );

      const userHTLCs = await ionicSwapEscrow.getUserHTLCs(sender.address);
      expect(userHTLCs.length).to.equal(1);
    });

    it("Should return user cross-chain swaps", async function () {
      const swapAmount = ethers.utils.parseEther("1.0");
      const secret = "my_secret_123";
      const hashlock = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(secret));
      const timelock = Math.floor(Date.now() / 1000) + 3600;
      const oneInchOrderHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

      // Create cross-chain swap
      await ionicSwapEscrow.connect(maker).createCrossChainSwapETH(
        taker.address,
        hashlock,
        timelock,
        oneInchOrderHash,
        { value: swapAmount }
      );

      const userSwaps = await ionicSwapEscrow.getUserCrossChainSwaps(maker.address);
      expect(userSwaps.length).to.equal(1);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update ICP network signer", async function () {
      const newSigner = addr1.address;
      
      const tx = await ionicSwapEscrow.connect(owner).updateICPNetworkSigner(newSigner);
      await tx.wait();

      expect(await ionicSwapEscrow.icpNetworkSigner()).to.equal(newSigner);
    });

    it("Should fail to update ICP network signer if not owner", async function () {
      try {
        await ionicSwapEscrow.connect(addr1).updateICPNetworkSigner(addr2.address);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Ownable: caller is not the owner");
      }
    });
  });
}); 