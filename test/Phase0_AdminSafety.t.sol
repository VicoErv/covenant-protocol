// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.t.sol";

contract Phase0_AdminSafetyTest is BaseTest {
    
    function setUp() public override {
        super.setUp();
        // Admin is already resolver in BaseTest's deployment flow (since admin deploys)
        // But BaseTest uses `address(this)` as admin/owner
        // BuilderEngine constructor sets owner/resolver to msg.sender (which is BaseTest contract)
    }

    function test_P0_1_AdminCannotStealEscrowFunds() public {
        // 1. Alice submits and creates value
        vm.prank(alice);
        covenantJoin.joinCovenant{value: 0.01 ether}();
        
        vm.prank(alice);
        builderEngine.submitProposal("Valid work", 5 ether);
        uint256 pid = builderEngine.nextProposalId() - 1;

        // Ensure builderEngine has funds BEFORE funding triggers
        vm.deal(address(builderEngine), 10 ether);

        // 2. HighRep users vote to fund it
        vm.prank(highRep1);
        builderEngine.approveProposal(pid); // Funded! 5 ether locked 
        
        // 3. Admin tries to resolve to SELF (stealing)
        // Admin resolves 'true' -> Should go to Alice (submitter), not Admin
        uint256 adminBalanceBefore = address(this).balance;
        
        vm.prank(alice); // Alice submits proof
        builderEngine.submitProof(pid, "proof.pdf");

        // Admin resolves
        builderEngine.resolveProposal(pid, true);
        
        uint256 adminBalanceAfter = address(this).balance;
        
        // Admin balance should NOT change (gas excluded in Foundry tests usually, but let's be strict)
        assertEq(adminBalanceAfter, adminBalanceBefore, "Admin should not receive funds from resolution");
        
        // Alice should have received it
        assertEq(alice.balance, 10 ether - 0.01 ether + 5 ether, "Alice should receive payout");
    }

    function test_P0_2_AdminCannotMintReputationDirectly() public {
        // Admin tries to call ReputationLedger.increaseReputation directly
        vm.expectRevert("Only BuilderEngine");
        reputationLedger.increaseReputation(admin, 100 ether);
    }

    function test_P0_OnlyResolverCanResolve() public {
        vm.prank(alice);
        covenantJoin.joinCovenant{value: 0.01 ether}();
        
        vm.prank(alice);
        builderEngine.submitProposal("job", 1 ether);
        uint256 pid = builderEngine.nextProposalId() - 1;
        
        // Fund it
        vm.deal(address(builderEngine), 10 ether);
        vm.prank(highRep1); builderEngine.approveProposal(pid);

        vm.prank(alice); builderEngine.submitProof(pid, "p");

        // Alice tries to resolve (she is NOT resolver)
        vm.prank(alice);
        vm.expectRevert("NotResolver");
        builderEngine.resolveProposal(pid, true);
        
        // Admin (resolver) works
        builderEngine.resolveProposal(pid, true);
    }
}
