import { Hex, zeroAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const SIGNER_PRIVATE_KEY = (process.env.SIGNER_PRIVATE_KEY ?? '0x00') as Hex;
const MINTER_CONTRACT = (process.env.MINTER_CONTRACT ?? zeroAddress) as Hex;

const account = privateKeyToAccount(SIGNER_PRIVATE_KEY);

const chainId = base.id;

const domain = {
  name: 'Farcaster Frame Zora Minter',
  version: '1',
  chainId,
  verifyingContract: MINTER_CONTRACT,
} as const;

export const types = {
  Mint: [
    { name: 'to', type: 'address' },
    { name: 'tokenId', type: 'uint256' },
    { name: 'fid', type: 'uint256' },
  ],
} as const;

interface MintData {
  to: Hex;
  tokenId: number;
  fid: number;
}

async function signMintData(mintData: MintData): Promise<Hex> {
  return account.signTypedData({
    domain,
    types,
    primaryType: 'Mint',
    message: { to: mintData.to, tokenId: BigInt(mintData.tokenId), fid: BigInt(mintData.fid) },
  });
}

export default signMintData;
