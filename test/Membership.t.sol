// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.t.sol";

contract MembershipTest is BaseTest {
    function testRevertSubmitIdeaNonMember() public {
        vm.prank(address(0x999)); // Random non-member
        vm.expectRevert("NotMember");
        builderEngine.submitProposal("Fraud", 1 ether);
    }

    function testMemberSubmitIdeaSuccess() public {
        vm.prank(alice);
        covenantJoin.joinCovenant{value: 0.01 ether}();

        vm.prank(alice);
        builderEngine.submitProposal("Legit Idea", 0.01 ether);

        (uint256 id, address submitter,,, BuilderEngine.Status status,, uint256 count) = builderEngine.proposals(0);
        assertEq(id, 0);
        assertEq(submitter, alice);
        assertEq(uint256(status), uint256(BuilderEngine.Status.Pending));
    }
}
