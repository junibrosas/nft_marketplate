// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTMarketplace is ERC721URIStorage {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds; // Total number of items ever created
  Counters.Counter private _itemsSold; // Total number of items sold

  uint256 listingPrice = 0.001 ether; // People have to pay to list their NFT; a listing fee
  address payable owner; // Owner of the smart contract

  constructor() ERC721("Metaverse Tokens", "META") {
    owner = payable(msg.sender);
  }

  mapping (uint256 => MarketItem) private idToMarketItem; // Mapping from token ID to MarketItem
 
  // Struct is a collection of primitive datatype
  struct MarketItem {
    uint256 tokenId;
    address payable seller;
    address payable owner;
    uint256 price;
    bool sold;
  }

  /**
   * @dev Emitted when `tokenId` token is listed on the market.
   * @param tokenId The token ID that is being listed on the market.
   * @param seller The address of the account selling the token.
   * @param owner The address of the account owning the token.
   * @param price The price of the token.
   * @param sold The status of the token.
   */
  event MarketItemCreated (
    uint256 indexed tokenId,
    address seller, 
    address owner,
    uint256 price,
    bool sold
  );

  /**
   * Return the listing price of the market.
   * @return listingPrice The listing price of the market.
   */
  function getListingPrice() public view returns (uint256) {
    return listingPrice;
  }

  /**
   * Update the listing price of the market. Should only be executable by the owner of the market.
   * @param _listingPrice The new listing price of the market.
   */
  function updateListingPrice(uint _listingPrice) public payable {
    require(msg.sender == owner, "Only marketplace owner can update listing price");
    listingPrice = _listingPrice; 
  }

  /**
   * Create a new market item
   * @param tokenId The token ID that is being listed on the market.
   * @param price The price of the token.
   */
  function createMarketItem(uint256 tokenId, uint256 price) private {
    require(price > 0, "Price must be greater than zero");
    require(msg.value == listingPrice, "Price must be equal to listing price");

    idToMarketItem[tokenId] = MarketItem(tokenId, payable(msg.sender), payable(address(this)), price, false);

    _transfer(msg.sender, address(this), tokenId);
    emit MarketItemCreated(tokenId, msg.sender, address(this), price, false);
  }

  /**
   * Mints a token and list it in the marketplace.
   * @param tokenURI The token URI of the token to be minted.
   * @param price The price of the token.
   */
  function createToken(string memory tokenURI, uint256 price) public payable returns(uint) {
    _tokenIds.increment();
    uint256 newTokenId = _tokenIds.current();
    _mint(msg.sender, newTokenId);
    _setTokenURI(newTokenId, tokenURI);
    createMarketItem(newTokenId, price);
    return newTokenId;
  }


  /**
   * Create the sale of the marketplace item.
   * Transfers ownership of the token, as well as funds between parties.
   * @param tokenId The token ID that is being listed on the market.
   */
  function createMarketSale(uint256 tokenId) public payable {
    uint price = idToMarketItem[tokenId].price;
    address seller = idToMarketItem[tokenId].seller;

    require(msg.value == price, "Please submit the asking price in order to complete the purchase");
    idToMarketItem[tokenId].owner = payable(msg.sender);
    idToMarketItem[tokenId].sold = true;
    idToMarketItem[tokenId].seller = payable(address(0));
    _itemsSold.increment();
    _transfer(address(this), msg.sender, tokenId);
    payable(owner).transfer(listingPrice);
    payable(seller).transfer(msg.value);
  }

  /**
   * Returns all unsold market items.
   * UserStory: The user should be able to see all the items available for sale.
   * @return items An array of unsold market items.
   */
  function fetchMarketItems() public view returns (MarketItem[] memory) {
    uint itemCount = _tokenIds.current();
    uint unsoldItemCount = _tokenIds.current() - _itemsSold.current();
    uint currentIndex = 0;

    // Push the unsold items into the array
    MarketItem[] memory items = new MarketItem[](unsoldItemCount);

    for (uint i = 0; i < itemCount; i++) {
      // If token has the same owner as the contract, it is unsold
      if (idToMarketItem[i + 1].owner == address(this)) {
        uint currentId = i + 1;
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }

    return items;
  }

  /**
   * Functionality to resell and cancel market items.
   * UserStory: The user should be able to retrieve their purchased NFTs from the marketplace.
   * @return items An array of market items owned by the user.
   */
  function fetchMyNFTs() public view returns(MarketItem[] memory) {
    uint totalItemCount = _tokenIds.current();
    uint itemCount = 0;
    uint currentIndex = 0;

    for(uint i = 0; i < totalItemCount; i++) {
       if (idToMarketItem[i + 1].owner == msg.sender) {
         itemCount += 1;
       }
    }

    MarketItem[] memory items = new MarketItem[](itemCount);
    for(uint i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].owner == msg.sender) {
        uint currentId = i + 1; // it will work as the tokenId
        MarketItem storage currentItem = idToMarketItem[currentId];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }

    return items;
  }

  /**
   * Functionality to resell and cancel market items.
   * You are re-listing the NFT so you have to pay the listing price again.
   * UserStory: The user should be able to retrieve all the NFTs listed by them.
   * @return items An array of market items listed by the user.
   */
  function resellToken(uint256 tokenId, uint256 price) public payable {
    require(idToMarketItem[tokenId].owner == msg.sender, "You are not the owner of this token");
    require(msg.value == listingPrice, "Price must be equal to listing price");
    idToMarketItem[tokenId].price = price;
    idToMarketItem[tokenId].sold = false;
    idToMarketItem[tokenId].seller = payable(msg.sender);
    idToMarketItem[tokenId].owner = payable(address(this));
    _itemsSold.decrement();
    _transfer(msg.sender, address(this), tokenId);
  }

  /**
   * Allow user to cancel their market listing.
   */
  function cancelItemListing(uint256 tokenId) public {
    require(idToMarketItem[tokenId].seller == msg.sender, "You are not the owner of this token");
    require(idToMarketItem[tokenId].sold == false, "Token is already sold");
    idToMarketItem[tokenId].price = 0;
    idToMarketItem[tokenId].seller = payable(address(0));
    idToMarketItem[tokenId].owner = payable(address(0));
    idToMarketItem[tokenId].sold = true;
    _itemsSold.increment();
    _transfer(address(this), msg.sender, tokenId); 
  }
}

 