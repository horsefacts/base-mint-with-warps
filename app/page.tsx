import { getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';
import { NEXT_PUBLIC_URL } from './config';
import { getCollection } from './lib/collection';

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getCollection();

  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        label: 'Check eligibility',
      },
    ],
    image: `${NEXT_PUBLIC_URL}/api/images/start`,
    post_url: `${NEXT_PUBLIC_URL}/api/start`,
  });

  return {
    title: name,
    description: "Check if you're eligible for a free mint",
    openGraph: {
      title: name,
      description: "Check if you're eligible for a free mint",
      images: [`${NEXT_PUBLIC_URL}/api/images/start`],
    },
    other: {
      ...frameMetadata,
      'fc:frame:image:aspect_ratio': '1:1',
    },
  };
}

export default async function Page() {
  const { name, image, address, tokenId } = await getCollection();
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-center min-h-screen items-start font-body">
        <div className="w-full md:w-3/4 flex justify-center items-center">
          <img src={image} alt={name} className="w-full lg:max-w-[800px] md:max-w-[400px] h-auto" />
        </div>
        <div className="w-full md:w-1/4 flex flex-col items-center md:items-start space-y-4 mt-4 md:mt-0 md:pl-4">
          <h1 className="text-2xl font-bold">{name}</h1>
          <a href={`https://zora.co/collect/base:${address}/${tokenId}`} target="_blank">
            <button className="px-4 py-2 bg-violet-500 text-white hover:bg-violet-700 transition duration-300">
              Mint on Zora
            </button>
          </a>
          <div className="text-xs text-stone-400 hover:underline tracking-tighter text-center">
            <a href="https://github.com/horsefacts/base-mint-with-warps" target="_blank">
              See code on Github
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
