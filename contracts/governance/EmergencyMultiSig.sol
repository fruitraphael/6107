// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EmergencyMultiSig
 * @notice 一个最小可用的 N-of-M 多签合约，用于课程项目的 "Emergency actions with multi-sig override"。
 *
 * 设计目标（教学演示足够用）：
 *  - 多个 owner 共同确认后，才能对任意 target 执行任意 calldata
 *  - 可用于：
 *      * 紧急取消 Timelock 中已排队但尚未执行的操作（Timelock 需授予本合约 CANCELLER_ROLE）
 *      * 紧急执行一些修复调用（前提是 target 合约允许本合约调用）
 *
 * 非目标：
 *  - 不追求极致 gas
 *  - 不支持 EIP-712 离线签名（课堂可选扩展）
 */
contract EmergencyMultiSig {
    // --- Events ---
    event Submit(uint256 indexed txId, address indexed proposer, address indexed target, uint256 value, bytes data);
    event Confirm(address indexed owner, uint256 indexed txId);
    event Revoke(address indexed owner, uint256 indexed txId);
    event Execute(uint256 indexed txId, address indexed executor, bool success, bytes result);

    // --- Config ---
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required; // confirmations required

    // --- Tx state ---
    struct Transaction {
        address target;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public approvedBy;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "MultiSig: not owner");
        _;
    }

    modifier txExists(uint256 txId) {
        require(txId < transactions.length, "MultiSig: tx not found");
        _;
    }

    modifier notExecuted(uint256 txId) {
        require(!transactions[txId].executed, "MultiSig: tx executed");
        _;
    }

    modifier notApproved(uint256 txId) {
        require(!approvedBy[txId][msg.sender], "MultiSig: already approved");
        _;
    }

    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length >= 2, "MultiSig: owners < 2");
        require(_required >= 2 && _required <= _owners.length, "MultiSig: bad required");

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "MultiSig: zero owner");
            require(!isOwner[owner], "MultiSig: duplicate owner");
            isOwner[owner] = true;
            owners.push(owner);
        }
        required = _required;
    }

    receive() external payable {}

    // --- Views ---
    function ownersCount() external view returns (uint256) {
        return owners.length;
    }

    function txCount() external view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(uint256 txId)
        external
        view
        txExists(txId)
        returns (
            address target,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 confirmations
        )
    {
        Transaction storage txn = transactions[txId];
        return (txn.target, txn.value, txn.data, txn.executed, txn.confirmations);
    }

    // --- Multi-sig flow ---
    function submit(address target, uint256 value, bytes calldata data) external onlyOwner returns (uint256 txId) {
        require(target != address(0), "MultiSig: zero target");
        transactions.push(Transaction({
            target: target,
            value: value,
            data: data,
            executed: false,
            confirmations: 0
        }));

        txId = transactions.length - 1;
        emit Submit(txId, msg.sender, target, value, data);

        // Auto-confirm by proposer to reduce clicks during demo
        _confirm(txId, msg.sender);
    }

    function confirm(uint256 txId)
        external
        onlyOwner
        txExists(txId)
        notExecuted(txId)
        notApproved(txId)
    {
        _confirm(txId, msg.sender);
    }

    function revoke(uint256 txId)
        external
        onlyOwner
        txExists(txId)
        notExecuted(txId)
    {
        require(approvedBy[txId][msg.sender], "MultiSig: not approved");
        approvedBy[txId][msg.sender] = false;
        transactions[txId].confirmations -= 1;
        emit Revoke(msg.sender, txId);
    }

    function execute(uint256 txId)
        external
        onlyOwner
        txExists(txId)
        notExecuted(txId)
    {
        Transaction storage txn = transactions[txId];
        require(txn.confirmations >= required, "MultiSig: not enough approvals");

        txn.executed = true;

        (bool ok, bytes memory res) = txn.target.call{value: txn.value}(txn.data);
        emit Execute(txId, msg.sender, ok, res);
    }

    // --- Internal ---
    function _confirm(uint256 txId, address owner) internal {
        approvedBy[txId][owner] = true;
        transactions[txId].confirmations += 1;
        emit Confirm(owner, txId);
    }
}
