import { Hex } from 'viem';

export interface Session {
  address?: Hex;
  transactionId?: string;
  transactionHash?: string;
}
