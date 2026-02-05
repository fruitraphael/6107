// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns(bool);
    function transfer(address to, uint256 amount) external returns(bool);
}

contract LendingPoolCore {
    // --- State Variables ---
    IERC20 public collateralToken; // e.g., mETH
    IERC20 public borrowToken;     // e.g., mDAI

    mapping(address => uint256) public collateralBalance;
    mapping(address => uint256) public debtBalance;

    // Risk Parameters
    uint256 public liquidationThreshold = 80; // 80% Loan-to-Value (LTV) limit
    uint256 public constant PRECISION = 100;

    // Mock Oracle Prices
    uint256 public collateralPrice = 2000e18; // 1 mETH = 2000 USD
    uint256 public borrowPrice = 1e18;      // 1 mDAI = 1 USD

    // --- Events ---

    event Deposited(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);
    event Liquidated(address indexed user, address indexed liquidator, uint256 debtRepaid, uint256 collateralSeized);

    constructor(address _collateral, address _borrow) {
        collateralToken = IERC20(_collateral);
        borrowToken = IERC20(_borrow);
    }


    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        collateralToken.transferFrom(msg.sender, address(this), amount);
        collateralBalance[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }


    function withdraw(uint256 amount) external {
        require(collateralBalance[msg.sender] >= amount, "Insufficient collateral balance");
        
        // Optimistically update balance
        collateralBalance[msg.sender] -= amount;
        
        // Ensure the user's position is still safe after withdrawal
        require(_healthFactor(msg.sender) >= 1e18, "Withdrawal denied: Health Factor too low");
        
        collateralToken.transfer(msg.sender, amount);
    }

    function borrow(uint256 amount) external {
        // Update debt before checking health factor
        debtBalance[msg.sender] += amount;
        
        // Enforce collateralization rule
        require(_healthFactor(msg.sender) >= 1e18, "Inadequate collateral for this loan amount");
        
        // Ensure pool has enough liquidity to lend
        require(borrowToken.transfer(msg.sender, amount), "Pool: Insufficient borrowable liquidity");
        
        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external {
        borrowToken.transferFrom(msg.sender, address(this), amount);
        debtBalance[msg.sender] -= amount;
        emit Repaid(msg.sender, amount);
    }

    function liquidate(address user, uint256 debtToCover) external {
        uint256 hf = _healthFactor(user);
        require(hf < 1e18, "Borrower is still safe (HF >= 1)");

        // Calculate collateral to seize: (Debt Value * 1.10) / Collateral Price
        // Includes a 10% bonus for the liquidator
        uint256 collateralToSeize = (debtToCover * borrowPrice * 110) / (collateralPrice * 100);
        require(collateralBalance[user] >= collateralToSeize, "User has insufficient collateral for seizure");

        // Execution: Liquidator pays debt, receives borrower's collateral at a discount
        borrowToken.transferFrom(msg.sender, address(this), debtToCover);
        
        debtBalance[user] -= debtToCover;
        collateralBalance[user] -= collateralToSeize;
        
        collateralToken.transfer(msg.sender, collateralToSeize);

        emit Liquidated(user, msg.sender, debtToCover, collateralToSeize);
    }

   
    function setCollateralPrice(uint256 _newPrice) external {
        collateralPrice = _newPrice;
    }

    // --- View Functions ---

    function getHealthFactor(address user) external view returns(uint256){
        return _healthFactor(user);
    }

   
    function _healthFactor(address user) internal view returns(uint256){
        if(debtBalance[user] == 0) return type(uint256).max;

        uint256 collateralValue = (collateralBalance[user] * collateralPrice) / 1e18;
        uint256 debtValue = (debtBalance[user] * borrowPrice) / 1e18;

        // Apply threshold 
        uint256 adjustedCollateralValue = (collateralValue * liquidationThreshold) / PRECISION;
        
        return (adjustedCollateralValue * 1e18) / debtValue;
    }
}