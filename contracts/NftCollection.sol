// contracts/NftCollection.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title NftCollection
 * @dev An ERC-721 compliant NFT contract with max supply, access control (Owner), and pausability.
 */
contract NftCollection is ERC721URIStorage, Ownable, Pausable {
    uint256 private immutable _maxSupply;
    uint256 private _tokenIdCounter;

    // Custom Errors
    error MaxSupplyReached();
    error TokenDoesNotExist(uint256 tokenId);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_
    )
        ERC721(name_, symbol_)
        Ownable(msg.sender)
    {
        require(maxSupply_ > 0, "Max supply must be greater than zero");
        _maxSupply = maxSupply_;
    }

    // --- Core ERC-721 Overrides ---

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        if (_ownerOf(tokenId) == address(0)) {
            revert TokenDoesNotExist(tokenId);
        }
        return super.tokenURI(tokenId);
    }

    // --- Business Logic ---

    function mint(address to, string memory uri)
        public
        onlyOwner
        whenNotPaused
    {
        if (_tokenIdCounter >= _maxSupply) {
            revert MaxSupplyReached();
        }

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    // --- Pausability ---

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // --- Views ---

    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
}
