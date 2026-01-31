// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./BaseTest.t.sol";
import "../src/resolvers/JuryResolver.sol";

contract Phase3_JuryTest is BaseTest {
    JuryResolver public jury;

    function setUp() public override {
        super.setUp();
        
        vm.prank(admin);
        jury = new JuryResolver(address(builderEngine), address(reputationLedger));
        
        vm.prank(admin);
        builderEngine.setResolver(address(jury));
    }

    function test_P3_1_JurorsMustHaveMinRep() public {
        uint256 pid = _createDeliveredProposal(alice);
        jury.openDispute(pid);

        // Alice (no rep) tries to vote
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert("LowReputation");
        jury.vote{value: 0.5 ether}(pid, true);
    }

    function test_P3_2_JurorsStakeBond() public {
        uint256 pid = _createDeliveredProposal(alice);
        jury.openDispute(pid);

        // HighRep1 (has rep) votes
        vm.deal(highRep1, 1 ether);
        vm.prank(highRep1);
        jury.vote{value: 0.5 ether}(pid, true);
        
        // Assert vote counted
        (,, uint256 vfTrue,,) = jury.disputes(pid);
        assertEq(vfTrue, 1);
    }
    
    function test_P3_3_MajorityResolves() public {
        uint256 pid = _createDeliveredProposal(alice);
        jury.openDispute(pid);
        
        // HighRep1 votes TRUE
        vm.deal(highRep1, 1 ether);
        vm.prank(highRep1);
        jury.vote{value: 0.5 ether}(pid, true);
        
        // HighRep2 votes FALSE
        vm.deal(highRep2, 1 ether);
        vm.prank(highRep2);
        jury.vote{value: 0.5 ether}(pid, false);
        
        // Create 3rd high rep user
        address highRep3 = address(0x33);
        vm.deal(highRep3, 10 ether);
        giveReputation(highRep3, 20 ether);
        
        // HighRep3 votes TRUE
        vm.prank(highRep3);
        jury.vote{value: 0.5 ether}(pid, true);
        
        // Majority is TRUE (2 vs 1)
        jury.finalizeDispute(pid);
        
        (, , , , BuilderEngine.Status status, , ) = builderEngine.proposals(pid);
        assertEq(uint(status), uint(BuilderEngine.Status.Completed), "Should be completed (True)");
    }

    function test_P3_4_WrongJurorsLoseStake() public {
        uint256 pid = _createDeliveredProposal(alice);
        jury.openDispute(pid);
        
        // HighRep1 votes FALSE (Will be wrong)
        vm.deal(highRep1, 1 ether);
        vm.prank(highRep1);
        jury.vote{value: 0.5 ether}(pid, false);
        
        // Make Majority TRUE
        address hr2 = address(0x44); vm.deal(hr2,10e18); giveReputation(hr2, 20e18);
        address hr3 = address(0x55); vm.deal(hr3,10e18); giveReputation(hr3, 20e18);
        
        vm.prank(hr2); jury.vote{value: 0.5 ether}(pid, true);
        vm.prank(hr3); jury.vote{value: 0.5 ether}(pid, true);
        
        uint256 balBefore = highRep1.balance;
        jury.finalizeDispute(pid);
        uint256 balAfter = highRep1.balance;
        
        // HighRep1 should NOT get bond back
        assertEq(balAfter, balBefore, "Loser bond slashed");
    }

    function _createDeliveredProposal(address submitter) internal returns (uint256) {
        if (!covenantJoin.isMember(submitter)) {
            vm.prank(submitter);
            covenantJoin.joinCovenant{value: 0.01 ether}();
        }

        vm.prank(submitter);
        builderEngine.submitProposal("task", 1 ether);
        uint256 pid = builderEngine.nextProposalId() - 1;
        
        vm.deal(address(builderEngine), 10 ether); 
        vm.prank(highRep1); builderEngine.approveProposal(pid);
        
        vm.prank(submitter);
        builderEngine.submitProof(pid, "proof");
        
        return pid;
    }
}
