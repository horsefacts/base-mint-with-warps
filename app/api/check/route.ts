import { FrameRequest, getFrameMessage } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { NEXT_PUBLIC_URL } from '../../config';
import { allowedOrigin } from '../../lib/origin';
import { kv } from '@vercel/kv';
import { getFrameHtml } from '../../lib/getFrameHtml';
import { Session } from '../../lib/types';
import { errorResponse, mintResponse } from '../../lib/responses';
import signMintData from '../../lib/signMint';

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API_KEY,
  });

  if (message?.button === 1 && isValid && allowedOrigin(message)) {
    const isActive = message.raw.action.interactor.active_status === 'active';

    if (isActive) {
      const fid = message.interactor.fid;
      let session = ((await kv.get(`session:${fid}`)) ?? {}) as Session;
      const { address, transactionId, checks, retries } = session;
      const totalChecks = checks ?? 0;
      const totalRetries = retries ?? 0;

      // If we've retried 3 times, give up
      if (totalRetries > 2) {
        return errorResponse();
      }

      // If we've checked 3 times, try to mint again
      if (totalChecks > 2 && session.address) {
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
            session = { ...session, transactionId, checks: 0, retries: totalRetries + 1 };
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
      }
      // If we have a transactionId, check the status
      if (transactionId) {
        await kv.set(`session:${fid}`, { ...session, checks: totalChecks + 1 });
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
          const {
            data: { transactionHash },
          } = await res.json();
          if (transactionHash) {
            await kv.set(`session:${fid}`, { ...session, transactionHash });
            return new NextResponse(
              getFrameHtml({
                buttons: [
                  {
                    label: 'Transaction',
                    action: 'link',
                    target: `https://basescan.org/tx/${transactionHash}`,
                  },
                ],
                image: `${NEXT_PUBLIC_URL}/api/images/success?address=${address}`,
              }),
            );
          } else {
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
