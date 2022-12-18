import { useState } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/router';
import Web3Modal from 'web3modal';
import { contractAddress, PINATA_KEY, PINATA_SECRET } from '../config';

import NFTMarketplace from '../abi/NFTMarketplace.json';
import axios from 'axios';

export default function CreateNFT() {
  const [fileUrl, setFileUrl] = useState<string>('');
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '' });
  const router = useRouter();
  const [loadingState, setLoadingState] = useState('not-loading');
  console.log(PINATA_KEY);
  console.log(PINATA_SECRET);

  // Upload image to IPFS
  async function imageUpload(e: any) {
    const file = e.target.files[0];

    try {
      const formData = new FormData();
      formData.append('file', file);
      const resFile = await axios({
        method: 'post',
        url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
        data: formData,
        headers: {
          'pinata_api_key': PINATA_KEY,
          'pinata_secret_api_key': PINATA_SECRET,
          'Content-Type': 'multipart/form-data'
        }
      });

      const imageURL = 'http://gateway.pinata.cloud/ipfs/' + resFile.data.IpfsHash;
      setFileUrl(imageURL);
    } catch (e) {
      console.log('Error: ', e);
    }
  }

  // First upload metadata to IPFS and then return URL to use in later transaction
  async function uploadToIPFS() {
    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl) return;
    setLoadingState('loading');

    try {
      var jsondata = JSON.stringify({
        "pinataMetadata": {
          "name": `${name}.json`,
        },
        "pinataContent": {
          name, description, image: fileUrl
        }
      });

      const resFile = await axios({
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        data: jsondata,
        headers: {
          'pinata_api_key': PINATA_KEY,
          'pinata_secret_api_key': PINATA_SECRET,
          'Content-Type': 'application/json'
        },
      });

      const tokenURI = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
      return tokenURI;

    } catch (error) {
      console.log("Error uploading file :", error);
    }
  }

  async function listNFTForSale() {
    const url = await uploadToIPFS();
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
    const price = ethers.utils.parseUnits(formInput.price.toString(), 'ether');

    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.toString();
    let transaction = await contract.createToken(url, price, { value: listingPrice });

    await transaction.wait();

    router.push('/');
  }

  return (
    <form className="space-y-8 divide-y divide-gray-200">
      <div className="space-y-8 divide-y divide-gray-200">
        <div>
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-6">
              <label htmlFor="cover-photo" className="block text-sm font-medium text-gray-700">
                Cover photo
              </label>
              <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={imageUpload} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
                Asset name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="asset-name"
                  id="first-name"
                  autoComplete="given-name"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
                />
              </div>
            </div>
            <div className="sm:col-span-6">
              <label htmlFor="asset-description" className="block text-sm font-medium text-gray-700">
                Asset Description
              </label>
              <div className="mt-1">
                <textarea
                  id="about"
                  name="asset-description"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
                />
              </div>
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
                Asset price in ETH
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="asset-price-eth"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-5 pb-5">
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          {
            fileUrl && (
              <button
                type="submit"
                className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={listNFTForSale}
              >
                {loadingState == 'not-loading' ? 'Create NFT' : 'Wait uploading...'}
              </button>
            )
          }
        </div>
      </div>
    </form>
  );
}