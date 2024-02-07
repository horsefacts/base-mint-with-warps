import { ZDK, ZDKNetwork, ZDKChain } from '@zoralabs/zdk';
import { NEXT_PUBLIC_URL, ZORA_COLLECTION_ADDRESS, ZORA_TOKEN_ID } from '../config';

const networkInfo = {
  network: ZDKNetwork.Base,
  chain: ZDKChain.BaseMainnet,
};

const API_ENDPOINT = 'https://api.zora.co/graphql';
const args = {
  endPoint: API_ENDPOINT,
  networks: [networkInfo],
  apiKey: process.env.API_KEY,
};

const zdk = new ZDK(args);

export async function getCollection() {
  const collection = await zdk.token({
    token: { address: ZORA_COLLECTION_ADDRESS, tokenId: ZORA_TOKEN_ID },
    includeFullDetails: false,
  });
  const name = collection.token?.token.name ?? 'Unknown Collection';
  const image = `${NEXT_PUBLIC_URL}/horse.png`;
  //collection.token?.token.image?.mediaEncoding?.original ?? `${NEXT_PUBLIC_URL}/giraffe.png`;
  return { name, image, address: ZORA_COLLECTION_ADDRESS, tokenId: ZORA_TOKEN_ID };
}
