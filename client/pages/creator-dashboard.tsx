import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { contractAddress } from "../config";
import NFTMarketplace from "../abi/NFTMarketplace.json";
import axios from "axios";
import Image from "next/image";
import ProductList from "../components/ProductList";

export default function CreatorDashboard() {
  const [nfts, setNfts] = useState<any>([]);
  const [loadingState, setLoadingState] = useState("not-loaded");

  useEffect(() => {
    if (typeof window !== "undefined") {
      loadNFTs();
    }

  }, []);

  async function loadNFTs() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const getnetwork = await provider.getNetwork();
    const goerliChainId = 5;
    if (getnetwork.chainId != goerliChainId) {
      alert("You are not connected to Goerli network");
      return;
    }
    // sign the transaction
    const signer = provider.getSigner();
    const marketplaceContract = new ethers.Contract(
      contractAddress,
      NFTMarketplace.abi,
      signer
    );
    const data = await marketplaceContract.fetchItemsListed();

    const items = await Promise.all(
      data.map(async (i: any) => {
        const tokenURI = await marketplaceContract.tokenURI(i.tokenId);

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
          image: meta.data.image,
          name: meta.data.name,
          tokenURI,
        };

        return item;
      })
    );

    setNfts(items);
    setLoadingState("loaded");
  }

  async function cancelListing(tokenId: any) {
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
    const transaction = await marketplaceContract.cancelItemListing(tokenId);
    await transaction.wait();
    loadNFTs();
  }

  if (loadingState == "not-loaded")
    return <h1 className="text-3xl">Wait Loading.......</h1>;

  if (loadingState == "loaded" && !nfts.length)
    return <h1 className="text-3xl">No NFTs listed by you</h1>;

  return (
    <div>
      <ProductList products={nfts} labelCTABtn="Cancel Listing" onClickItem={(nft) => cancelListing(nft.tokenId)} />
    </div>
  );
}
