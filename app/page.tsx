import { getFrameMetadata, FrameMetadataType } from '@coinbase/onchainkit';
import type { Metadata } from 'next';
import { NEXT_PUBLIC_URL } from './config';

const frameMetadata = getFrameMetadata({
  buttons: [
    {
      label: 'Claim with Active Badge',
    },
    {
      label: 'Mint',
      action: 'mint',
      target: 'eip155:8453:0xf569a12768a050eab250aa3cc71d53564ce6e349:1',
    },
  ],
  image: `${NEXT_PUBLIC_URL}/giraffe.png`,
  post_url: `${NEXT_PUBLIC_URL}/api/start`,
});

export const metadata: Metadata = {
  title: 'Farcaster: Giraffe',
  description: 'Mint with Warps or Active Badge',
  openGraph: {
    title: 'Farcaster: Giraffe',
    description: 'Mint with Warps or Active Badge',
    images: [`${NEXT_PUBLIC_URL}/giraffe.png`],
  },
  other: {
    ...frameMetadata,
  },
};

export default function Page() {
  return (
    <>
      <h1>Farcaster: Giraffe</h1>
      <img src="/giraffe.png" alt="Farcaster: Giraffe" />
    </>
  );
}
