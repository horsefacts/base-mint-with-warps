import { FrameRequest, getFrameMessage, getFrameHtmlResponse } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { NEXT_PUBLIC_URL } from '../../config';
import { getAddressButtons } from '../../lib/helpers';

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  const { isValid, message } = await getFrameMessage(body, { neynarApiKey: process.env.NEYNAR_API_KEY });

  if (message?.button === 1 && isValid) {
    const isActive = message.raw.action.interactor.active_status === 'active';

    if (isActive) {
      const buttons = getAddressButtons(message.interactor);
      return new NextResponse(
        getFrameHtmlResponse({
          buttons,
          image: `${NEXT_PUBLIC_URL}/api/images/select?date=${Date.now()}`,
          post_url: `${NEXT_PUBLIC_URL}/api/confirm`,
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
          image: `${NEXT_PUBLIC_URL}/api/images/inactive`,
        }),
      );
    }
  } else return new NextResponse('Unauthorized', { status: 401 });
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
