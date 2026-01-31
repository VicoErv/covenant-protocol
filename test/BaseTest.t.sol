// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/CovenantJoin.sol";
import "../src/ReputationLedger.sol";
import "../src/BuilderEngine.sol";

contract BaseTest is Test {
    CovenantJoin public covenantJoin;
    ReputationLedger public reputationLedger;
    BuilderEngine public builderEngine;

    address public admin = address(this);
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    address public highRep1 = address(0x10);
    address public highRep2 = address(0x11);

    function setUp() public virtual {
        // Deploy contracts
        covenantJoin = new CovenantJoin();
        reputationLedger = new ReputationLedger();
        builderEngine = new BuilderEngine(address(covenantJoin), address(reputationLedger));

        // Wiring
        covenantJoin.setBuilderEngine(address(builderEngine));
        reputationLedger.setBuilderEngine(address(builderEngine));

        // Fund users
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(charlie, 10 ether);
        vm.deal(highRep1, 10 ether);
        vm.deal(highRep2, 10 ether);
        
        // Setup High Rep Users (Manual storage manipulation)
        // highRep1 join + Rep
        vm.prank(highRep1);
        covenantJoin.joinCovenant{value: 0.01 ether}();
        giveReputation(highRep1, 20 ether);
        
        // highRep2 join + Rep
        vm.prank(highRep2);
        covenantJoin.joinCovenant{value: 0.01 ether}();
        giveReputation(highRep2, 20 ether);
    }
    
    function giveReputation(address user, uint256 amount) internal {
        // _reputation is at slot 0 of ReputationLedger
        bytes32 slot = keccak256(abi.encode(user, uint256(0)));
        vm.store(address(reputationLedger), slot, bytes32(amount));
    }
}
