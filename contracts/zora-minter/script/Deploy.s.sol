// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.23;

import {ZoraMinter} from "../src/ZoraMinter.sol";
import {Script, console} from "forge-std/Script.sol";

contract Deploy is Script {
    address internal signer = address(0x44DD9B89d4087246A0Fc54dba0c69000a4F59162);
    address internal collection = address(0xF569a12768a050eab250Aa3Cc71d53564CE6E349);
    address internal minter = address(0xFF8B0f870ff56870Dc5aBd6cB3E6E89c8ba2e062);

    function run() public {
        address owner = msg.sender;

        vm.broadcast();
        new ZoraMinter{ salt: unicode"🐎" }(owner, owner, signer, collection, minter);
    }
}
