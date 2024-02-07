// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

interface IZoraCreator1155 {
    function mintWithRewards(
        address minter,
        uint256 tokenId,
        uint256 quantity,
        bytes calldata minterArguments,
        address mintReferral
    ) external payable;

    function mintFee() external view returns (uint256);
}
