// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title TimeLock
 * @notice 课程项目使用的 TimelockController 封装：
 *         - 强制 minDelay >= 24h (1 days)
 *         - 用于治理提案 queue -> execute 的时间锁执行
 *
 * @dev Timelock 的角色建议：
 *      - PROPOSER_ROLE  => Governance(Governor) 合约
 *      - EXECUTOR_ROLE  => address(0) (任何人都可执行已到期操作) 或指定执行者
 *      - CANCELLER_ROLE => 多签 (紧急取消恶意/错误操作)
 *      - DEFAULT_ADMIN_ROLE => 多签 (角色管理)
 */
contract TimeLock is TimelockController {
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {
        require(minDelay >= 1 days, "TimeLock: delay must be >= 24h");
    }
}
