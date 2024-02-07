// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Ownable} from "solady/auth/Ownable.sol";
import {EIP712} from "solady/utils/EIP712.sol";
import {SignatureCheckerLib} from "solady/utils/SignatureCheckerLib.sol";
import {SafeTransferLib} from "solady/utils/SafeTransferLib.sol";

import {IZoraCreator1155} from "./IZoraCreator1155.sol";

contract ZoraMinter is Ownable, EIP712 {
    /// @notice Token has already been claimed for this fid
    error AlreadyMinted();

    /// @notice Caller provided invalid `Mint` signature
    error InvalidSignature();

    /// @notice Emitted when a user mints through the Frame server
    event Mint(address indexed to, uint256 indexed tokenId, uint256 indexed fid);

    /// @notice emitted when owner changes the referrer address
    event SetReferrer(address oldReferrer, address newReferrer);

    /// @notice emitted when owner changes the signer address
    event SetSigner(address oldSigner, address newSigner);

    /// @notice emitted when owner changes the collection address
    event SetCollection(address oldCollection, address newCollection);

    /// @notice emitted when owner changes the minter address
    event SetMinter(address oldMinter, address newMinter);

    /// @notice EIP-712 typehash for `Mint` message
    bytes32 public constant MINT_TYPEHASH =
        keccak256("Mint(address to,uint256 tokenId,uint256 fid)");

    /// @notice Address that receives mint referral rewards
    address public referrer;

    /// @notice Address authorized to sign `Mint` messages
    address public signer;

    /// @notice Address of the Zora collection contract
    address public collection;

    /// @notice Address of the Zora minter
    address public minter;

    /// @notice Mapping tracking fids that have minted
    mapping(uint256 fid => bool) public hasMinted;

    /// @notice Set owner and Zora contract parameters.
    /// @param _owner Contract owner address. Can withdraw and change paramters.
    /// @param _referrer Zora rewards referrer address.
    /// @param _signer Frame server address that must sign `Mint` messages.
    /// @param _collection Zora 1155 collection address.
    /// @param _minter Zora minter address.
    constructor(
        address _owner,
        address _referrer,
        address _signer,
        address _collection,
        address _minter
    ) {
        _initializeOwner(_owner);
        emit SetReferrer(address(0), referrer = _referrer);
        emit SetSigner(address(0), signer = _signer);
        emit SetCollection(address(0), collection = _collection);
        emit SetMinter(address(0), minter = _minter);
    }

    /// @notice Mint a token.
    ///         Caller must provide an EIP-712 `Mint` signature from the Frame server.
    function mint(
        address to,
        uint256 tokenId,
        uint256 fid,
        bytes calldata sig
    ) external {
        if (!_verifySignature(to, tokenId, fid, sig)) {
            revert InvalidSignature();
        }
        if (hasMinted[fid]) {
            revert AlreadyMinted();
        }

        hasMinted[fid] = true;
        emit Mint(to, tokenId, fid);

        uint256 fee = mintFee();
        IZoraCreator1155(collection).mintWithRewards{value: fee}(
            minter, tokenId, 1, abi.encode(to), referrer
        );
    }

    /// @notice Set referrer address. Only callable by owner.
    /// @param _referrer New referrer address
    function setReferrer(address _referrer) external onlyOwner {
        emit SetReferrer(referrer, referrer = _referrer);
    }

    /// @notice Set signer address. Only callable by owner.
    /// @param _signer New signer address
    function setSigner(address _signer) external onlyOwner {
        emit SetSigner(signer, signer = _signer);
    }

    /// @notice Set collection address. Only callable by owner.
    /// @param _collection New collection address
    function setCollection(address _collection) external onlyOwner {
        emit SetCollection(collection, collection = _collection);
    }

    /// @notice Set minter address. Only callable by owner.
    /// @param _minter New minter address
    function setMinter(address _minter) external onlyOwner {
        emit SetMinter(minter, minter = _minter);
    }

    /// @notice Withdraw from contract balance. Only callable by owner.
    function withdraw(address to, uint256 amount) external onlyOwner {
        SafeTransferLib.safeTransferETH(to, amount);
    }

    /// @notice Read Zora collection mint fee.
    function mintFee() public view returns (uint256) {
        return IZoraCreator1155(collection).mintFee();
    }

    /// @dev EIP-712 helper.
    function hashTypedData(bytes32 structHash) public view returns (bytes32) {
        return _hashTypedData(structHash);
    }

    /// @dev EIP-712 domain name and contract version.
    function _domainNameAndVersion()
        internal
        pure
        override
        returns (string memory, string memory)
    {
        return ("Farcaster Frame Zora Minter", "1");
    }

    /// @dev Verify EIP-712 `Mint` signature.
    function _verifySignature(
        address to,
        uint256 tokenId,
        uint256 fid,
        bytes calldata sig
    ) internal view returns (bool) {
        bytes32 digest =
            _hashTypedData(keccak256(abi.encode(MINT_TYPEHASH, to, tokenId, fid)));
        return
            SignatureCheckerLib.isValidSignatureNowCalldata(signer, digest, sig);
    }

    receive() external payable {}
}
