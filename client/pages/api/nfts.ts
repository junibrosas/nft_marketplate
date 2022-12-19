// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import axios from "axios";
import { contractAddress, INFURA_URL } from "../../config";
import NFTMarketplace from "../../abi/NFTMarketplace.json";

type Data = {
  name: string;
};

const loadNFTs = async () => {
  const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);
  const marketContract = new ethers.Contract(
    contractAddress,
    NFTMarketplace.abi,
    provider
  );
  const data = await marketContract.fetchMarketItems(); // All unsold NFTs

  const items: any = await Promise.all(
    data.map(async (i: any) => {
      const tokenUri = await marketContract.tokenURI(i.tokenId);
      const meta = await axios.get(tokenUri);
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

  return items;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const response = await loadNFTs();

  res.status(200).json(response);
}
