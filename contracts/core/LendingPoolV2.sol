// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LendingPoolV1.sol";

contract LendingPoolV2 is LendingPoolV1 {
    // 构造函数透传
    constructor(address _collateral, address _borrow) LendingPoolV1(_collateral, _borrow) {}

    // [演示] 新增变量 (因为 V1 有 __gap，这里是安全的)
    uint256 public protocolFee; 

    // [演示] 新增功能
    function setProtocolFee(uint256 _fee) external onlyOwner {
        protocolFee = _fee;
    }

    // [演示] 版本号变更
    function getVersion() public pure override returns (string memory) {
        return "V2.0 - Fee Logic Added";
    }
}