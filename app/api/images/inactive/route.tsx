import { ImageResponse } from 'next/og';
import { Card } from '../../../components/Card';
import { CARD_DIMENSIONS } from '../../../config';

export async function GET() {
  return new ImageResponse(
    <Card message="You don't have an active badge. You can mint with Warps below." />,
    CARD_DIMENSIONS,
  );
}
