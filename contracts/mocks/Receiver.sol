// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

error ReceiverForcedRevert();

contract Receiver {
    uint256 public storedValue;
    uint256 public totalReceived;

    event StoredValueUpdated(uint256 value, uint256 attachedValue);
    event FallbackTriggered(address indexed sender, uint256 value, bytes data);

    function setStoredValue(uint256 newValue) external payable {
        storedValue = newValue;
        totalReceived += msg.value;
        emit StoredValueUpdated(newValue, msg.value);
    }

    function forceRevert() external pure {
        revert ReceiverForcedRevert();
    }

    receive() external payable {
        totalReceived += msg.value;
        emit FallbackTriggered(msg.sender, msg.value, '');
    }

    fallback() external payable {
        totalReceived += msg.value;
        emit FallbackTriggered(msg.sender, msg.value, msg.data);
    }
}
