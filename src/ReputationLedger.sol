// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Import removed 
// Wait, I should use OpenZeppelin for Ownable or implement it?
// The user said "Minimal MVP". I can implement simple ownership/auth.
// Start simple.

contract ReputationLedger {
    mapping(address => uint256) private _reputation;
    address public builderEngine;
    address public owner;

    event ReputationUpdated(address indexed user, uint256 newAmount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyBuilderEngine() {
        require(msg.sender == builderEngine, "Only BuilderEngine");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function setBuilderEngine(address _builderEngine) external onlyOwner {
        builderEngine = _builderEngine;
    }

    function getReputation(address user) external view returns (uint256) {
        return _reputation[user];
    }

    function increaseReputation(address user, uint256 amount) external onlyBuilderEngine {
        _reputation[user] += amount;
        emit ReputationUpdated(user, _reputation[user]);
    }

    function decreaseReputation(address user, uint256 amount) external onlyBuilderEngine {
        if (_reputation[user] < amount) {
            _reputation[user] = 0;
        } else {
            _reputation[user] -= amount;
        }
        emit ReputationUpdated(user, _reputation[user]);
    }
}
