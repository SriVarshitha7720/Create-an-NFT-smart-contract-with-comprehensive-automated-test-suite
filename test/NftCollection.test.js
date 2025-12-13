// test/NftCollection.test.js

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NftCollection", function () {
    let NftCollection, nft, owner, minter, receiver, approved, operator;
    const MAX_SUPPLY = 3;
    const NAME = "CoolNFT";
    const SYMBOL = "CNFT";
    const BASE_URI = "https://test.com/";

    // Helper to deploy a fresh contract instance before each test
    beforeEach(async function () {
        [owner, minter, receiver, approved, operator] = await ethers.getSigners();
        NftCollection = await ethers.getContractFactory("NftCollection");
        // Deploy with Owner address, Name, Symbol, MaxSupply
        nft = await NftCollection.deploy(NAME, SYMBOL, MAX_SUPPLY);
        await nft.waitForDeployment();
    });

    // --- Initial Configuration & Metadata Tests ---
    describe("Deployment and Configuration", function () {
        it("Should set the correct name, symbol, and max supply", async function () {
            expect(await nft.name()).to.equal(NAME);
            expect(await nft.symbol()).to.equal(SYMBOL);
            expect(await nft.maxSupply()).to.equal(MAX_SUPPLY);
            expect(await nft.totalSupply()).to.equal(0);
        });

        it("Should set the deployer as the owner", async function () {
            expect(await nft.owner()).to.equal(owner.address);
        });
    });

    // --- Minting Tests (Business Rules & Security) ---
    describe("Minting", function () {
        const tokenId = 1;
        const uri = BASE_URI + tokenId;

        it("Should allow the owner to mint a token", async function () {
            await expect(nft.mint(minter.address, uri))
                .to.emit(nft, "Transfer")
                .withArgs(ethers.ZeroAddress, minter.address, tokenId);

            expect(await nft.ownerOf(tokenId)).to.equal(minter.address);
            expect(await nft.balanceOf(minter.address)).to.equal(1);
            expect(await nft.totalSupply()).to.equal(1);
            expect(await nft.tokenURI(tokenId)).to.equal(uri);
        });

        it("Should revert if a non-owner attempts to mint", async function () {
            await expect(nft.connect(minter).mint(minter.address, uri))
                .to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
        });

        it("Should revert if max supply is reached", async function () {
            // Mint up to MAX_SUPPLY (3 tokens)
            for (let i = 1; i <= MAX_SUPPLY; i++) {
                await nft.mint(minter.address, BASE_URI + i);
            }
            expect(await nft.totalSupply()).to.equal(MAX_SUPPLY);

            // Attempt to mint the 4th token
            await expect(nft.mint(minter.address, BASE_URI + (MAX_SUPPLY + 1)))
                .to.be.revertedWithCustomError(nft, "MaxSupplyReached");
        });

        it("Should revert if minting to the zero address", async function () {
            // OpenZeppelin's _safeMint handles this check
            await expect(nft.mint(ethers.ZeroAddress, uri))
                .to.be.revertedWith("ERC721: transfer to the zero address");
        });
    });

    // --- Transfer and Approval Tests (ERC-721 Compliance) ---
    describe("Transfers and Approvals", function () {
        const tokenId = 1;

        beforeEach(async function () {
            // Pre-mint a token to minter for transfer tests
            await nft.mint(minter.address, BASE_URI + tokenId);
        });

        // Simple Transfer: Owner initiated
        it("Should allow the owner to transfer the token", async function () {
            await expect(nft.connect(minter).transferFrom(minter.address, receiver.address, tokenId))
                .to.emit(nft, "Transfer")
                .withArgs(minter.address, receiver.address, tokenId);

            expect(await nft.ownerOf(tokenId)).to.equal(receiver.address);
            expect(await nft.balanceOf(minter.address)).to.equal(0);
            expect(await nft.balanceOf(receiver.address)).to.equal(1);
        });

        // Approved Address Transfer
        it("Should allow an approved address to transfer the token", async function () {
            // 1. Owner approves
            await expect(nft.connect(minter).approve(approved.address, tokenId))
                .to.emit(nft, "Approval")
                .withArgs(minter.address, approved.address, tokenId);
            
            expect(await nft.getApproved(tokenId)).to.equal(approved.address);

            // 2. Approved address transfers
            await expect(nft.connect(approved).transferFrom(minter.address, receiver.address, tokenId))
                .to.not.be.reverted;

            expect(await nft.ownerOf(tokenId)).to.equal(receiver.address);
            expect(await nft.getApproved(tokenId)).to.equal(ethers.ZeroAddress); // Approval should be cleared
        });

        // Operator Transfer (ApprovalForAll)
        it("Should allow an approved operator to transfer the token", async function () {
            // 1. Owner sets operator
            await expect(nft.connect(minter).setApprovalForAll(operator.address, true))
                .to.emit(nft, "ApprovalForAll")
                .withArgs(minter.address, operator.address, true);

            expect(await nft.isApprovedForAll(minter.address, operator.address)).to.be.true;

            // 2. Operator transfers
            await expect(nft.connect(operator).transferFrom(minter.address, receiver.address, tokenId))
                .to.not.be.reverted;
            
            expect(await nft.ownerOf(tokenId)).to.equal(receiver.address);
        });

        // Failure: Unauthorized transfer
        it("Should revert if a non-owner/non-approved attempts to transfer", async function () {
            await expect(nft.connect(operator).transferFrom(minter.address, receiver.address, tokenId))
                .to.be.revertedWith("ERC721: caller is not approved or owner for token");
        });
    });
    
    // --- Pausability Tests ---
    describe("Pausability", function () {
        const tokenId = 1;

        beforeEach(async function () {
            // Mint a token for transfer tests
            await nft.mint(minter.address, BASE_URI + tokenId);
            await nft.pause(); // Pause the contract
        });

        it("Should prevent minting when paused", async function () {
            await expect(nft.mint(receiver.address, BASE_URI + 2))
                .to.be.revertedWith("EnforcedPause");
        });

        it("Should prevent transfers when paused", async function () {
            await expect(nft.connect(minter).transferFrom(minter.address, receiver.address, tokenId))
                .to.be.revertedWith("EnforcedPause");
        });

        it("Should allow the owner to unpause and resume operations", async function () {
            await nft.unpause();
            // Test that minting is now possible
            await expect(nft.mint(receiver.address, BASE_URI + 2)).to.not.be.reverted;
            // Test that transfer is now possible
            await expect(nft.connect(minter).transferFrom(minter.address, receiver.address, tokenId)).to.not.be.reverted;
        });

        it("Should revert if a non-owner tries to pause/unpause", async function () {
            await expect(nft.connect(minter).unpause())
                .to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
            // Unpause before testing pause
            await nft.unpause(); 
            await expect(nft.connect(minter).pause())
                .to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
        });
    });

    // --- Gas & Performance Test ---
    describe("Performance", function () {
        it("Should have reasonable gas usage for a mint operation", async function () {
            const tx = await nft.mint(minter.address, BASE_URI + 1);
            const receipt = await tx.wait();
            // ERC-721 mints typically range from 50k to 100k gas.
            // We assert a generous upper limit (150,000 gas) to ensure efficiency.
            expect(receipt.gasUsed).to.be.lessThan(150000); 
        });
    });
});