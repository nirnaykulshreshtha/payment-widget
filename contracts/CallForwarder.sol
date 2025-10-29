// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import {UUPSUpgradeable} from '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {ReentrancyGuardUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract CallForwarder is Initializable, UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20 for IERC20;

    struct ForwardCall {
        address target;
        uint256 value;
        bytes data;
    }

    event CallExecuted(uint256 indexed index, address indexed target, bytes data, bytes result);
    event CallFailed(uint256 indexed index, address indexed target, bytes data, bytes reason);
    event WithdrawNative(address indexed recipient, uint256 amount);
    event WithdrawToken(address indexed token, address indexed recipient, uint256 amount);

    error InvalidTarget(address target);
    error InvalidRecipient(address recipient);
    error NativeTransferFailed(address recipient, uint256 amount);
    error CallExecutionFailed(uint256 index, bytes reason);
    error NothingToWithdraw();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) external initializer {
        if (initialOwner == address(0)) {
            revert InvalidRecipient(initialOwner);
        }
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
    }

    function executeCalls(ForwardCall[] calldata calls, bool allowFailure)
        external
        nonReentrant
        returns (bool[] memory successes, bytes[] memory results)
    {
        uint256 length = calls.length;
        successes = new bool[](length);
        results = new bytes[](length);

        for (uint256 i = 0; i < length; i++) {
            ForwardCall calldata forwardCall = calls[i];
            if (forwardCall.target == address(0)) {
                revert InvalidTarget(forwardCall.target);
            }

            (bool success, bytes memory result) = forwardCall.target.call{value: forwardCall.value}(forwardCall.data);
            successes[i] = success;
            results[i] = result;

            if (success) {
                emit CallExecuted(i, forwardCall.target, forwardCall.data, result);
            } else {
                emit CallFailed(i, forwardCall.target, forwardCall.data, result);
                if (!allowFailure) {
                    revert CallExecutionFailed(i, result);
                }
            }
        }
    }

    function withdrawNative(address payable recipient)
        external
        onlyOwner
        nonReentrant
        returns (uint256 amount)
    {
        if (recipient == address(0)) {
            revert InvalidRecipient(recipient);
        }
        amount = address(this).balance;
        if (amount == 0) {
            revert NothingToWithdraw();
        }

        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            revert NativeTransferFailed(recipient, amount);
        }

        emit WithdrawNative(recipient, amount);
    }

    function withdrawToken(IERC20 token, address recipient)
        external
        onlyOwner
        nonReentrant
        returns (uint256 amount)
    {
        if (recipient == address(0)) {
            revert InvalidRecipient(recipient);
        }
        amount = token.balanceOf(address(this));
        if (amount == 0) {
            revert NothingToWithdraw();
        }

        token.safeTransfer(recipient, amount);
        emit WithdrawToken(address(token), recipient, amount);
    }

    receive() external payable {}

    fallback() external payable {}
}
