import { FrameRequest, getFrameMessage } from '@coinbase/onchainkit';
import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { NEXT_PUBLIC_URL } from '../../config';
import { getAddressButtons } from '../../lib/addresses';
import signMintData from '../../lib/signMint';
import { allowedOrigin } from '../../lib/origin';
import { getFrameHtml } from '../../lib/getFrameHtml';
import { errorResponse, mintResponse } from '../../lib/responses';
import { Session } from '../../lib/types';

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API_KEY,
  });

  if (isValid && allowedOrigin(message)) {
    if (message.button === 1) {
      const buttons = getAddressButtons(message.interactor);
      return new NextResponse(
        getFrameHtml({
          buttons,
          image: `${NEXT_PUBLIC_URL}/api/images/select`,
          post_url: `${NEXT_PUBLIC_URL}/api/confirm`,
        }),
      );
    }

    const isActive = message.raw.action.interactor.active_status === 'active';
    const fid = message.interactor.fid;
    let session = ((await kv.get(`session:${fid}`)) ?? {}) as Session;

    if (isActive && session?.address) {
      const { address } = session;
      const sig = await signMintData({
        to: address,
        tokenId: 1,
        fid,
      });
      const res = await fetch('https://frame.syndicate.io/api/mint', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${process.env.SYNDICATE_API_KEY}`,
        },
        body: JSON.stringify({
          frameTrustedData: body.trustedData.messageBytes,
          args: [address, 1, fid, sig],
        }),
      });
      if (res.status === 200) {
        const {
          success,
          data: { transactionId },
        } = await res.json();
        if (success) {
          session = { ...session, transactionId };
          await kv.set(`session:${fid}`, session);
          const res = await fetch(
            `https://frame.syndicate.io/api/transaction/${transactionId}/hash`,
            {
              headers: {
                'content-type': 'application/json',
                Authorization: `Bearer ${process.env.SYNDICATE_API_KEY}`,
              },
            },
          );
          if (res.status === 200) {
            return new NextResponse(
              getFrameHtml({
                buttons: [
                  {
                    label: '🔄 Check status',
                  },
                ],
                post_url: `${NEXT_PUBLIC_URL}/api/check`,
                image: `${NEXT_PUBLIC_URL}/api/images/check`,
              }),
            );
          }
        }
      }
      return errorResponse();
    } else {
      return mintResponse();
    }
  } else return new NextResponse('Unauthorized', { status: 401 });
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
