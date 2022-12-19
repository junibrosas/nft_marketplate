import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import axios from 'axios';

import { contractAddress } from '../config';
import NFTMarketplace from '../abi/NFTMarketplace.json';
import ProductList from '../components/ProductList';
import Head from 'next/head';

function MyNFTs() {
  const [nfts, setNfts] = React.useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
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
    const marketplaceContract = new ethers.Contract(contractAddress, NFTMarketplace.abi, signer);
    const data = await marketplaceContract.fetchMyNFTs();
    const items: any = await Promise.all(data.map(async (i: any) => {

      const tokenURI = await marketplaceContract.tokenURI(i.tokenId);

      const meta = await axios({
        method: "get",
        url: '/api/meta?uri=' + tokenURI
      })

      let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        tokenURI
      };

      return item;
    }));

    setNfts(items);
    setLoadingState('loaded');
  }

  async function resellNFT(tokenId: any, tokenPrice: any) {
    setLoadingState("not-loaded");
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const marketplaceContract = new ethers.Contract(
      contractAddress,
      NFTMarketplace.abi,
      signer
    );
    const price = ethers.utils.parseUnits(tokenPrice, "ether");
    let listingPrice = await marketplaceContract.getListingPrice();
    listingPrice = listingPrice.toString();
    const transaction = await marketplaceContract.resellToken(tokenId, price, {
      value: listingPrice,
    });
    await transaction.wait();
    loadNFTs();
  }

  if (loadingState == 'not-loaded') return (
    <h1 className="text-3xl">Wait loading...</h1>
  )

  if (loadingState == 'loaded' && !nfts.length) return (
    <h1 className="text-3xl">You have not owned any items yet</h1>
  )

  return (
    <div>
      <Head>
        <title>My NFTs | NFT Marketplate</title>
      </Head>
      <ProductList labelCTABtn="Resell NFT" products={nfts} onClickItem={(nft) => resellNFT(nft.tokenId, nft.price)} />
    </div>
  )
}

export default MyNFTs