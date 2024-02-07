// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.23;

import {Test} from "forge-std/Test.sol";

import {ZoraMinter} from "../src/ZoraMinter.sol";

interface IERC1155 {
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

contract ZoraMinterTest is Test {
    ZoraMinter public minter;

    address internal owner = makeAddr("owner");
    address internal referrer = makeAddr("referrer");
    address internal signer;
    uint256 internal signerPk;

    address internal alice = makeAddr("alice");
    address internal collection = address(0xF569a12768a050eab250Aa3Cc71d53564CE6E349);
    address internal zoraMinter = address(0xFF8B0f870ff56870Dc5aBd6cB3E6E89c8ba2e062);
    IERC1155 internal token = IERC1155(collection);

    event SetReferrer(address oldReferrer, address newReferrer);
    event SetSigner(address oldSigner, address newSigner);
    event SetCollection(address oldCollection, address newCollection);
    event SetMinter(address oldMinter, address newMinter);
    event Mint(address indexed to, uint256 indexed tokenId, uint256 indexed fid);

    error Unauthorized();

    function setUp() public {
        vm.createSelectFork("base");
        (signer, signerPk) = makeAddrAndKey("signer");
        minter = new ZoraMinter(owner, referrer, signer, collection, zoraMinter);
    }

    function testFuzz_mint_validSig(
        address caller,
        uint256 fid
    ) public {
        vm.deal(address(minter), minter.mintFee());
        bytes memory sig = _signMint(signerPk, alice, 1, fid);

        vm.expectEmit();
        emit Mint(alice, 1, fid);

        vm.prank(caller);
        minter.mint(alice, 1, fid, sig);

        assertEq(address(minter).balance, 0);
        assertEq(minter.hasMinted(fid), true);
        assertEq(token.balanceOf(alice, 1), 1);
    }

    function testFuzz_mint_invalidSig(
        address caller,
        uint256 fid,
        bytes calldata sig
    ) public {
        vm.deal(address(minter), minter.mintFee());
        bytes memory validSig = _signMint(signerPk, alice, 1, fid);
        vm.assume(keccak256(sig) != keccak256(validSig));

        vm.expectRevert(ZoraMinter.InvalidSignature.selector);
        vm.prank(caller);
        minter.mint(alice, 1, fid, sig);
    }

    function testFuzz_mint_alreadyMinted(
        address caller,
        uint256 fid
    ) public {
        uint256 fee = minter.mintFee();
        vm.deal(address(minter), fee * 2);
        bytes memory sig = _signMint(signerPk, alice, 1, fid);

        vm.prank(caller);
        minter.mint(alice, 1, fid, sig);

        assertEq(address(minter).balance, fee);
        assertEq(minter.hasMinted(fid), true);
        assertEq(token.balanceOf(alice, 1), 1);

        vm.expectRevert(ZoraMinter.AlreadyMinted.selector);
        vm.prank(caller);
        minter.mint(alice, 1, fid, sig);
    }

    function testFuzz_setReferrer(address newReferrer) public {
        vm.assume(newReferrer != referrer);

        assertEq(minter.referrer(), referrer);

        vm.expectEmit();
        emit SetReferrer(referrer, newReferrer);

        vm.prank(owner);
        minter.setReferrer(newReferrer);

        assertEq(minter.referrer(), newReferrer);
    }

    function testFuzz_setReferrer_auth(address caller, address newReferrer) public {
        vm.assume(caller != owner);

        vm.expectRevert(Unauthorized.selector);
        vm.prank(caller);
        minter.setReferrer(newReferrer);
    }

    function testFuzz_setSigner(address newSigner) public {
        vm.assume(newSigner != signer);

        assertEq(minter.signer(), signer);

        vm.expectEmit();
        emit SetSigner(signer, newSigner);

        vm.prank(owner);
        minter.setSigner(newSigner);

        assertEq(minter.signer(), newSigner);
    }

    function testFuzz_setSigner_auth(address caller, address newSigner) public {
        vm.assume(caller != owner);

        vm.expectRevert(Unauthorized.selector);
        vm.prank(caller);
        minter.setSigner(newSigner);
    }

    function testFuzz_setCollection(address newCollection) public {
        vm.assume(newCollection != collection);

        assertEq(minter.collection(), collection);

        vm.expectEmit();
        emit SetCollection(collection, newCollection);

        vm.prank(owner);
        minter.setCollection(newCollection);

        assertEq(minter.collection(), newCollection);
    }

    function testFuzz_setCollection_auth(address caller, address newCollection) public {
        vm.assume(caller != owner);

        vm.expectRevert(Unauthorized.selector);
        vm.prank(caller);
        minter.setCollection(newCollection);
    }

    function testFuzz_setMinter(address newMinter) public {
        vm.assume(newMinter != zoraMinter);

        assertEq(minter.minter(), zoraMinter);

        vm.expectEmit();
        emit SetMinter(zoraMinter, newMinter);

        vm.prank(owner);
        minter.setMinter(newMinter);

        assertEq(minter.minter(), newMinter);
    }

    function testFuzz_setMinter_auth(address caller, address newMinter) public {
        vm.assume(caller != owner);

        vm.expectRevert(Unauthorized.selector);
        vm.prank(caller);
        minter.setMinter(newMinter);
    }

    function testFuzz_withdraw(
        address to,
        uint256 balance,
        uint256 _amount
    ) public {
        vm.assume(to != address(minter));
        uint256 amount = bound(_amount, 0, balance);

        uint256 toBefore = address(to).balance;

        vm.deal(address(minter), balance);
        vm.prank(owner);
        minter.withdraw(to, amount);

        assertEq(address(minter).balance, balance - amount);
        assertEq(address(to).balance, toBefore + amount);
    }

    function testFuzz_withdraw_auth(address caller, uint256 amount) public {
        vm.assume(caller != owner);

        vm.expectRevert(Unauthorized.selector);
        vm.prank(caller);
        minter.withdraw(owner, amount);
    }

    function _signMint(
        uint256 pk,
        address to,
        uint256 tokenId,
        uint256 fid
    ) public returns (bytes memory signature) {
        bytes32 digest = minter.hashTypedData(
            keccak256(
                abi.encode(
                    minter.MINT_TYPEHASH(),
                    to,
                    tokenId,
                    fid
                )
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        signature = abi.encodePacked(r, s, v);
        assertEq(signature.length, 65);
    }
}
