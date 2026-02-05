实现功能 (Core Features)
超额抵押借贷 (Over-collateralized Lending): 实现了基础的 deposit, withdraw, borrow, repay 逻辑。

实时风险监控 (Risk Management): 通过 _healthFactor 函数实时计算用户的账户安全状态。

清算引擎 (Liquidation Engine): 设计并实现了清算机制。当用户健康因子 (HF) 低于 1 时，允许外部清算人介入，通过代还债务获得 10% 的抵押品奖励，确保协议不产生坏账。

预言机模拟 (Oracle Simulation): 提供价格设置接口 setCollateralPrice，用于演示市场剧烈波动时的协议反应。

📄 合约文件说明
LendingPoolCore.sol: 协议的核心逻辑合约。

MockToken.sol: 用于模拟测试的 ERC20 代币（mETH 和 mDAI）。

🚀 队友交接指南 
➡️ To Member A 
Storage Layout: 请在设计 UUPS 代理合约时，严格遵循我在 LendingPoolCore.sol 中定义的变量顺序，以防升级时出现存储冲突（Storage Collision）。

Initializable: 我目前使用的是 constructor，你在做 UUPS 封装时需要将其改为 initialize 函数。

➡️ To Member C 
Access Control: 合约中的 setCollateralPrice 目前是公开的，这是演示用的后门。在最终集成时，请务必使用你的 Governance 合约对其进行权限控制（如添加 onlyOwner）。

Emergency Stop: 建议在核心函数中加入你的 Pausable 开关，以应对极端安全情况。

➡️ To Member D 
ABI & Address: 请使用 Remix 编译后生成的 ABI。你需要调用 getHealthFactor(address) 来判断用户是否安全。

Events: 我已添加了 Deposited, Borrowed, Liquidated 事件。前端可以监听这些事件来实时更新 UI 状态和交易历史。


如何使用 (How to use)
部署两个 MockToken (分别命名为 mETH 和 mDAI)。

部署 LendingPoolCore，将上述两个代币地址填入构造函数。

给 LendingPoolCore 合约 mint 一定数量的 mDAI (作为借款池储备)。

