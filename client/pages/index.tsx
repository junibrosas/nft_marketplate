import { ethers } from "ethers";
import Web3Modal from 'web3modal';
import { useState, useEffect } from "react";
import axios from "axios";

import { contractAddress, INFURA_URL } from '../config';
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
      const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);
      const marketContract = new ethers.Contract(
        contractAddress,
        NFTMarketplace.abi,
        provider
      );
      const data = await marketContract.fetchMarketItems(); // All unsold NFTs

      const items: any = await Promise.all(
        data.map(async (i: any) => {
          const tokenURI = await marketContract.tokenURI(i.tokenId);
          const meta = await axios({
            method: "get",
            url: '/api/meta?uri=' + tokenURI
          })
          let price = ethers.utils.formatUnits(i.price.toString(), "ether");

          let item = {
            price,
            tokenId: i.tokenId.toNumber(),
            seller: i.seller,
            owner: i.owner,
            name: meta.data.name,
            image: meta.data.image,
            description: meta.data.description,
          };

          return item;
        })
      );

      setNfts(items);
      setLoadingState('loaded');
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      loadNFTs();
    }
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