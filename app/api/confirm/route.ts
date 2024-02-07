import { FrameRequest, getFrameMessage, getFrameHtmlResponse } from '@coinbase/onchainkit';
import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { NEXT_PUBLIC_URL } from '../../config';
import { getAddresses } from '../../lib/helpers';

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, { neynarApiKey: process.env.NEYNAR_API_KEY });

  if (message?.button && message?.button > 0 && message?.button < 5 && isValid) {
    const fid = message.interactor.fid;
    const isActive = message.raw.action.interactor.active_status === 'active';
    if (isActive) {
      const addresses = getAddresses(message.interactor);
      const address = addresses[message.button - 1];
      await kv.set(`session:${fid}`, { address });
      return new NextResponse(
        getFrameHtmlResponse({
          buttons: [{ label: '⬅️ Back' }, { label: '✅ Mint' }],
          image: `${NEXT_PUBLIC_URL}/api/images/confirm?address=${address}&date=${Date.now()}`,
          post_url: `${NEXT_PUBLIC_URL}/api/relay`,
        }),
      );
    } else {
      return new NextResponse(
        getFrameHtmlResponse({
          buttons: [
            {
              label: 'Mint',
              action: 'mint',
              target: 'eip155:8453:0xf569a12768a050eab250aa3cc71d53564ce6e349:1',
            },
          ],
          image: `${NEXT_PUBLIC_URL}/giraffe.png`,
        }),
      );
    }
  } else return new NextResponse('Unauthorized', { status: 401 });
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
