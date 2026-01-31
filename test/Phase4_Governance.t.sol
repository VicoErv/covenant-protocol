// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.t.sol";

contract Phase4_GovernanceTest is BaseTest {
    address public gov = makeAddr("governance");

    function setUp() public override {
        super.setUp();

        vm.prank(admin);
        builderEngine.setGovernance(gov);
    }

    function test_P4_1_AdminExpiredCannotChangeResolver() public {
        // Warp past expiry (Constructor: block.number + 100000)
        vm.roll(block.number + 100001);

        vm.prank(admin);
        vm.expectRevert("AdminExpired");
        builderEngine.setResolver(address(0xDEAD));
    }

    function test_P4_2_GovernanceCanReplaceResolver() public {
        // Warp past expiry to prove Gov still works
        vm.roll(block.number + 100001);

        address newResolver = address(0x999);

        vm.prank(gov);
        builderEngine.setResolver(newResolver);

        assertEq(builderEngine.resolver(), newResolver);
    }
}
