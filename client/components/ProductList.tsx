import Image from "next/image"

interface Props {
  products: any;
  labelCTABtn?: any;
  onBuyNFT: (nft: any) => void
}

export default function ProductList({ products, onBuyNFT, labelCTABtn = 'Buy now' }: Props) {
  if (!products || !products.length) {
    return (
      <h1 className="text-3xl">No items in the marketplace</h1>
    )
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="sr-only">Products</h2>
        <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {products.map((product: any) => (
            <a key={product.id} href={product.href} className="group">
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 xl:aspect-w-7 xl:aspect-h-8">
                <Image
                  width={300}
                  height={200}
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover object-center group-hover:opacity-75"
                />
              </div>
              <h3 className="mt-4 text-sm text-gray-700">{product.name}</h3>
              <p className='text-gray-400'>{product.description}</p>
              <p className="mt-1 text-lg font-medium text-gray-900">{product.price}</p>
              <button className='w-full bg-pink-500 text-white font-bold py-2 px-12 rounded' onClick={() => onBuyNFT(product)}>{labelCTABtn}</button>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
