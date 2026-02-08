// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/**
 * @title GovernanceToken
 * @notice 用于课程项目的治理代币 (ERC20Votes)：
 *         - 支持 delegate / snapshot 投票权
 *         - onlyOwner 可以 mint，方便课堂演示给同学分发投票权
 *
 * @dev OpenZeppelin v5.x 写法：需要 override _update / nonces
 */
contract GovernanceToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    constructor(address initialOwner)
        ERC20("6107 Governance Token", "GOV")
        ERC20Permit("6107 Governance Token")
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    // --- Solidity required overrides (OZ v5) ---

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
