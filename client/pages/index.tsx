import { ethers } from "ethers";
import Web3Modal from 'web3modal';
import { useState, useEffect } from "react";
import axios from "axios";

import { contractAddress } from '../config';
import NFTMarketplace from '../abi/NFTMarketplace.json';
import ProductList from "../components/ProductList";
import Head from "next/head";

export default function Home() {
  const [nfts, setNfts] = useState<any>([]);
  const [loadingState, setLoadingState] = useState('not-loaded');

  /**
   * Load all NFTs from the smart contract
   */
  async function loadNFTs() {
    try {
      const response = await axios.get('/api/nfts');
      setNfts(response.data);
      setLoadingState('loaded');
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    loadNFTs();
  }, []);

  async function buyNFT(nft: any) {
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
      <h1 className="text-3xl">Loading...</h1>
    )
  }

  if (loadingState == 'loaded' && !nfts.length) {
    return (
      <h1 className="text-3xl">No items in the marketplace</h1>
    )
  }

  return (
    <div>
      <Head>
        <title>NFT Marketplate</title>
      </Head>
      <ProductList products={nfts} onClickItem={buyNFT} />
    </div>
  )
}