import { NextResponse } from 'next/server';
import { NEXT_PUBLIC_URL, ZORA_COLLECTION_ADDRESS, ZORA_TOKEN_ID } from '../config';
import { getFrameHtml } from './getFrameHtml';

export function errorResponse() {
  return new NextResponse(
    getFrameHtml({
      image: `${NEXT_PUBLIC_URL}/api/images/error`,
    }),
  );
}

export async function mintResponse() {
  return new NextResponse(
    getFrameHtml({
      buttons: [
        {
          label: 'Mint',
          action: 'mint',
          target: `eip155:8453:${ZORA_COLLECTION_ADDRESS}:${ZORA_TOKEN_ID}`,
        },
      ],
      image: `${NEXT_PUBLIC_URL}/api/images/inactive`,
    }),
  );
}
