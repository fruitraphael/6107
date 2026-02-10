// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LiquidityMining
 * @notice Staking rewards contract for liquidity providers
 */
contract LiquidityMining {
    IERC20 public stakingToken;
    IERC20 public rewardToken;
    IERC20 public bonusRewardToken;

    uint256 public rewardRate = 1e18;
    uint256 public bonusRewardRate = 5e17;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public bonusRewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public userBonusRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public bonusRewards;
    mapping(address => uint256) public balances;

    uint256 public totalSupply;
    address public owner;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward, uint256 bonusReward);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier updateReward(address account) {
        _updateRewards();
        if (account != address(0)) {
            rewards[account] = earned(account);
            bonusRewards[account] = earnedBonus(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
            userBonusRewardPerTokenPaid[account] = bonusRewardPerTokenStored;
        }
        _;
    }

    constructor(
        address _stakingToken,
        address _rewardToken,
        address _bonusRewardToken,
        uint256 _rewardRate,
        uint256 _bonusRewardRate
    ) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        bonusRewardToken = IERC20(_bonusRewardToken);
        rewardRate = _rewardRate;
        bonusRewardRate = _bonusRewardRate;
        lastUpdateTime = block.timestamp;
        owner = msg.sender;
    }

    function _updateRewards() internal {
        rewardPerTokenStored = rewardPerToken();
        bonusRewardPerTokenStored = bonusRewardPerToken();
        lastUpdateTime = block.timestamp;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            ((block.timestamp - lastUpdateTime) * rewardRate * 1e18) /
            totalSupply;
    }

    function bonusRewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) {
            return bonusRewardPerTokenStored;
        }
        return
            bonusRewardPerTokenStored +
            ((block.timestamp - lastUpdateTime) * bonusRewardRate * 1e18) /
            totalSupply;
    }

    function earned(address account) public view returns (uint256) {
        return
            (balances[account] *
                (rewardPerToken() - userRewardPerTokenPaid[account])) /
            1e18 +
            rewards[account];
    }

    function earnedBonus(address account) public view returns (uint256) {
        return
            (balances[account] *
                (bonusRewardPerToken() - userBonusRewardPerTokenPaid[account])) /
            1e18 +
            bonusRewards[account];
    }

    function stake(uint256 amount) external updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        totalSupply += amount;
        balances[msg.sender] += amount;
        require(
            stakingToken.transferFrom(msg.sender, address(this), amount),
            "Stake transfer failed"
        );
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        totalSupply -= amount;
        balances[msg.sender] -= amount;
        require(
            stakingToken.transfer(msg.sender, amount),
            "Withdraw transfer failed"
        );
        emit Withdrawn(msg.sender, amount);
    }

    function claimRewards() external updateReward(msg.sender) {
        uint256 mainReward = rewards[msg.sender];
        uint256 bonusReward = bonusRewards[msg.sender];
        require(mainReward > 0 || bonusReward > 0, "No rewards to claim");
        rewards[msg.sender] = 0;
        bonusRewards[msg.sender] = 0;
        if (mainReward > 0) {
            require(
                rewardToken.transfer(msg.sender, mainReward),
                "Main reward transfer failed"
            );
        }
        if (bonusReward > 0) {
            require(
                bonusRewardToken.transfer(msg.sender, bonusReward),
                "Bonus reward transfer failed"
            );
        }
        emit RewardClaimed(msg.sender, mainReward, bonusReward);
    }

    function updateRewardRates(uint256 _rewardRate, uint256 _bonusRewardRate)
        external
        onlyOwner
    {
        _updateRewards();
        rewardRate = _rewardRate;
        bonusRewardRate = _bonusRewardRate;
    }

    function getUserInfo(address account)
        external
        view
        returns (
            uint256 stakedAmount,
            uint256 mainReward,
            uint256 bonusReward
        )
    {
        return (balances[account], earned(account), earnedBonus(account));
    }
}
