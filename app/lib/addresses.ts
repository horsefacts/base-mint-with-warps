import { FrameButtonMetadata } from '@coinbase/onchainkit/dist/types/core/types';

export function getAddresses(interactor: {
  fid: number;
  custody_address: string;
  verified_accounts: string[];
}) {
  let addresses = [];

  // Add all verified accounts
  if (interactor.verified_accounts) {
    interactor.verified_accounts.forEach((account) => {
      addresses.push(account);
    });
  }

  // If there are no verified accounts, add the custody address
  if (addresses.length === 0 && interactor.custody_address && interactor.custody_address !== '0x') {
    addresses.push(interactor.custody_address);
  }
  return addresses;
}

export function getAddressButtons(interactor: {
  fid: number;
  custody_address: string;
  verified_accounts: string[];
}) {
  let buttons = [];

  // Add all verified accounts
  if (interactor.verified_accounts) {
    interactor.verified_accounts.forEach((account) => {
      buttons.push({
        label: `🟢 ${account.slice(0, 6)}`,
      });
    });
  }

  // If there are no verified accounts, add the custody address
  if (buttons.length === 0 && interactor.custody_address && interactor.custody_address !== '0x') {
    buttons.push({
      label: `🟣 ${interactor.custody_address.slice(0, 6)}`,
    });
  }
  return buttons as [FrameButtonMetadata, ...FrameButtonMetadata[]];
}
