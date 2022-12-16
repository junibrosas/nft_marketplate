import { ethers } from "ethers";
import Web3Modal from 'web3modal';
import { useState, useEffect } from "react";
import axios from "axios";
import { contractAddress, INFURA_URL } from '../config';
import NFTMarketplace from '../abi/NFTMarketplace.json';
import ProductList from "../components/ProductList";

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');

  /**
   * Load all NFTs from the smart contract
   */
  async function loadNFTs() {
    const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);
    const marketContract = new ethers.Contract(contractAddress, NFTMarketplace.abi, provider);
    const data = await marketContract.fetchMarketItems(); // All unsold NFTs

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await marketContract.tokenURI(i.tokenId);
      const meta = await axios.get(tokenUri);
      let price = ethers.utils.formatUtils(i.price.toString(), 'ether');

      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.name,
        description: meta.data.description
      }

      return item;
    }));

    setNfts(items);
    setLoadingState('loaded');
  }

  useEffect(() => {
    loadNFTs();
  }, []);

  async function buyNFT(nft) {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const getnetwork = await provider.getNetwork();
    const goerliChainId = 5;
    if (getnetwork.chainId != goerliChainId) {
      alert('Please connect to Goerli Testnet');
      return;
    }

    // sign the transaction
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, NFTMarketplace.abi, signer);
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');
    const transaction = await contract.createMarketSale(nft.tokenId, { value: price });
    await transaction.wait();

    loadNFTs();
  }

  if (loadingState == 'not-loaded') {
    return (
      <h1 className="px-20 py-10 text-3xl">Loading...</h1>
    )
  }

  if (loadingState == 'loaded' && !nfts.length) {
    return (
      <h1 className="px-20 py-10 text-3xl">No items in the marketplace</h1>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>

      </div>
      <h1>Welcome to Home!</h1>
      <ProductList />
    </div>
  )
}