// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/CovenantJoin.sol";
import "../src/ReputationLedger.sol";
import "../src/BuilderEngine.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        CovenantJoin covenantJoin = new CovenantJoin();
        console.log("CovenantJoin deployed at:", address(covenantJoin));
        
        covenantJoin.setMembershipBond(0);
        console.log("CovenantJoin: Membership bond set to 0 for test mode");

        ReputationLedger reputationLedger = new ReputationLedger();
        console.log("ReputationLedger deployed at:", address(reputationLedger));

        BuilderEngine builderEngine = new BuilderEngine(address(covenantJoin), address(reputationLedger));
        console.log("BuilderEngine deployed at:", address(builderEngine));

        reputationLedger.setBuilderEngine(address(builderEngine));
        console.log("ReputationLedger authorized BuilderEngine");
        
        covenantJoin.setBuilderEngine(address(builderEngine));
        console.log("CovenantJoin linked to BuilderEngine Treasury");

        // Fund Treasury for testing
        (bool success, ) = address(builderEngine).call{value: 10 ether}("");
        require(success, "Treasury funding failed");
        console.log("Treasury funded with 10 ETH");

        vm.stopBroadcast();
    }
}
