// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.t.sol";

contract EndToEndTest is BaseTest {
    function testGoldenPath() public {
        // 1. Alice joins
        vm.prank(alice);
        covenantJoin.joinCovenant{value: 0.01 ether}();

        // 2. Alice submits
        vm.prank(alice);
        builderEngine.submitProposal("Golden", 0.005 ether);

        // 3. Quorum Vote
        vm.prank(highRep1);
        builderEngine.approveProposal(0);

        // Verify Funded
        (,,,, BuilderEngine.Status status1,,) = builderEngine.proposals(0);
        assertEq(uint256(status1), uint256(BuilderEngine.Status.Funded));

        // 4. Deliver
        vm.prank(alice);
        builderEngine.submitProof(0, "ipfs://golden");

        // Verify Delivered
        (,,,, BuilderEngine.Status status2,,) = builderEngine.proposals(0);
        assertEq(uint256(status2), uint256(BuilderEngine.Status.Delivered));

        // 5. Resolve
        uint256 alicPre = alice.balance;
        vm.prank(admin);
        builderEngine.resolveProposal(0, true);

        // 6. Verify Outcome
        // Status Completed
        (,,,, BuilderEngine.Status status3,,) = builderEngine.proposals(0);
        assertEq(uint256(status3), uint256(BuilderEngine.Status.Completed));

        // Paid
        assertEq(alice.balance, alicPre + 0.005 ether);

        // Rep Gained
        assertEq(reputationLedger.getReputation(alice), 5 ether);
    }
}
