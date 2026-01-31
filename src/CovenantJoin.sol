// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CovenantJoin {
    mapping(address => bool) public isMember;
    uint256 public constant MEMBERSHIP_BOND = 0.01 ether;

    address public builderEngine;
    address public owner;

    event MemberJoined(address indexed member);
    
    constructor() {
        owner = msg.sender;
    }
    
    function setBuilderEngine(address _builderEngine) external {
        require(msg.sender == owner, "Only owner");
        builderEngine = _builderEngine;
    }

    function joinCovenant() external payable {
        require(!isMember[msg.sender], "Already a member");
        require(msg.value == MEMBERSHIP_BOND, "Incorrect bond amount");

        isMember[msg.sender] = true;
        
        if (builderEngine != address(0)) {
            (bool success, ) = builderEngine.call{value: address(this).balance}("");
            require(success, "Transfer failed"); // Automatically forward all balance? Or just the bond?
            // "Forward collected membership fees"
            // Let's forward just the msg.value to be safe/simple
        }
        
        emit MemberJoined(msg.sender);
    }
}
