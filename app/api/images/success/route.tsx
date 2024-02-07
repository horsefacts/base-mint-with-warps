import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import { NEXT_PUBLIC_URL } from '../../../config';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const address = searchParams.get('address') ?? '';
  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          width: '800px',
          height: '420px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          textAlign: 'center',
        }}
      >
        <img width="800" height="800" src={`${NEXT_PUBLIC_URL}/giraffe.png`} />
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: '0',
            width: '100%',
            background: 'rgb(64, 27, 114)',
            color: 'white',
            fontSize: '24px',
            paddingTop: '36px',
            paddingBottom: '60px',
          }}
        >
          <p style={{ margin: '0 auto' }}>Minted to {address}</p>
        </div>
      </div>
    ),
    {
      width: 800,
      height: 420,
    },
  );
}
