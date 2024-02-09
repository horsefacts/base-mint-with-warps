import { FrameRequest, getFrameMessage } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { NEXT_PUBLIC_URL } from '../../config';
import { allowedOrigin } from '../../lib/origin';
import { kv } from '@vercel/kv';
import { getFrameHtml } from '../../lib/getFrameHtml';
import { Session } from '../../lib/types';
import { errorResponse, mintResponse } from '../../lib/responses';

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API_KEY,
  });

  if (message?.button === 1 && isValid && allowedOrigin(message)) {
    const isActive = message.raw.action.interactor.active_status === 'active';

    if (isActive) {
      const fid = message.interactor.fid;
      const session = ((await kv.get(`session:${fid}`)) ?? {}) as Session;
      const { address, transactionId, checks } = session;
      const retries = checks ?? 0;
      if (retries > 2) {
        await kv.set(`session:${fid}`, { address });
        return new NextResponse(
          getFrameHtml({
            buttons: [
              {
                label: '🔄 Check status',
              },
            ],
            post_url: `${NEXT_PUBLIC_URL}/api/retry`,
            image: `${NEXT_PUBLIC_URL}/api/images/check`,
          }),
        );
      }
      if (transactionId) {
        await kv.set(`session:${fid}`, { ...session, checks: retries + 1 });
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
                image: `${NEXT_PUBLIC_URL}/api/images/success?address=${address}&date=${Date.now()}`,
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
