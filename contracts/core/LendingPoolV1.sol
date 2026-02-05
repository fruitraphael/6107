// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

// 1. 引入 Member B 的代码 (必须在同一目录下)
import "./LendingPoolCore.sol"; 

contract LendingPoolV1 is 
    LendingPoolCore,            // <--- 继承 Member B 的业务逻辑
    Initializable, 
    UUPSUpgradeable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable 
{
    // Storage Gap
    // 预留 50 个槽位，防止未来升级时覆盖了父类的变量，或者是新加变量没地方放
    uint256[50] private __gap;

    // 构造函数透传
    // Solidity 语法要求：如果父合约有构造参数，子合约必须在 constructor 中传参
    // 注意：这只影响 Implementation 合约的部署，不影响 Proxy 状态
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address _collateral, address _borrow) LendingPoolCore(_collateral, _borrow) {
        _disableInitializers();
    }

    // 初始化函数 (Proxy 的实际"构造函数")
    function initialize(
        address _collateral, 
        address _borrow, 
        address _initialOwner
    ) public initializer {
        // 1. 初始化 OpenZeppelin 模块
        __Ownable_init(_initialOwner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        // 2. [关键操作] 重新初始化 Member B 的变量
        // 因为 Proxy 不会运行 LendingPoolCore 的 constructor
        // 你必须在这里手动给 Member B 的 public 变量赋值！
        collateralToken = IERC20(_collateral);
        borrowToken = IERC20(_borrow);
        
        // Member B 定义的默认值也必须在这里重写，否则 Proxy 里全是 0
        liquidationThreshold = 80;
        collateralPrice = 2000e18;
        borrowPrice = 1e18;
    }

    //  UUPS 升级授权
    // 只有 Owner (未来是 Member C 的 Governance) 能调用
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // 辅助函数：版本号
    function getVersion() public pure virtual returns (string memory) {
        return "V1.0";
    }
}