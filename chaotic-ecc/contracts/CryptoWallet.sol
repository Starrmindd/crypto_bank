// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./WalletRegistry.sol";

/// @title CryptoWallet
/// @notice Core wallet contract — deposit, withdraw, transfer with KYC gating
contract CryptoWallet is ReentrancyGuard, Pausable, Ownable {
    WalletRegistry public registry;

    struct Transaction {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        TxType txType;
        bytes32 txHash;
    }

    enum TxType { Deposit, Withdraw, Transfer }

    mapping(address => uint256) private balances;
    mapping(address => Transaction[]) private userTxHistory;
    Transaction[] private allTransactions;

    uint256 public dailyLimit = 10 ether;
    mapping(address => uint256) private dailySpent;
    mapping(address => uint256) private lastSpendDay;

    event Deposited(address indexed user, uint256 amount, bytes32 txHash);
    event Withdrawn(address indexed user, uint256 amount, bytes32 txHash);
    event Transferred(address indexed from, address indexed to, uint256 amount, bytes32 txHash);
    event DailyLimitUpdated(uint256 newLimit);

    modifier onlyKYC() {
        require(registry.isKYCApproved(msg.sender), "KYC not approved");
        _;
    }

    modifier withinDailyLimit(uint256 amount) {
        uint256 today = block.timestamp / 1 days;
        if (lastSpendDay[msg.sender] < today) {
            dailySpent[msg.sender] = 0;
            lastSpendDay[msg.sender] = today;
        }
        require(dailySpent[msg.sender] + amount <= dailyLimit, "Daily limit exceeded");
        _;
        dailySpent[msg.sender] += amount;
    }

    constructor(address registryAddress) {
        registry = WalletRegistry(registryAddress);
    }

    /// @notice Deposit ETH into the wallet
    function deposit() external payable nonReentrant whenNotPaused onlyKYC {
        require(msg.value > 0, "Zero deposit");
        balances[msg.sender] += msg.value;

        bytes32 txHash = _buildTxHash(msg.sender, address(this), msg.value, TxType.Deposit);
        _recordTx(msg.sender, address(this), msg.value, TxType.Deposit, txHash);

        emit Deposited(msg.sender, msg.value, txHash);
    }

    /// @notice Withdraw ETH from the wallet
    function withdraw(uint256 amount)
        external
        nonReentrant
        whenNotPaused
        onlyKYC
        withinDailyLimit(amount)
    {
        require(amount > 0, "Zero amount");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;

        bytes32 txHash = _buildTxHash(msg.sender, address(0), amount, TxType.Withdraw);
        _recordTx(msg.sender, address(0), amount, TxType.Withdraw, txHash);

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Transfer failed");

        emit Withdrawn(msg.sender, amount, txHash);
    }

    /// @notice Transfer ETH to another registered user by their uniqueID
    function transfer(string calldata recipientID, uint256 amount)
        external
        nonReentrant
        whenNotPaused
        onlyKYC
        withinDailyLimit(amount)
    {
        require(amount > 0, "Zero amount");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        address recipient = registry.resolveID(recipientID);
        require(recipient != address(0), "Recipient not found");
        require(recipient != msg.sender, "Cannot transfer to self");

        balances[msg.sender] -= amount;
        balances[recipient] += amount;

        bytes32 txHash = _buildTxHash(msg.sender, recipient, amount, TxType.Transfer);
        _recordTx(msg.sender, recipient, amount, TxType.Transfer, txHash);

        emit Transferred(msg.sender, recipient, amount, txHash);
    }

    /// @notice Get balance of a user
    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    /// @notice Get transaction history for a user
    function getHistory(address user) external view returns (Transaction[] memory) {
        return userTxHistory[user];
    }

    /// @notice Get remaining daily limit for a user
    function getRemainingDailyLimit(address user) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        if (lastSpendDay[user] < today) return dailyLimit;
        return dailyLimit - dailySpent[user];
    }

    /// @notice Admin: update daily limit
    function setDailyLimit(uint256 newLimit) external onlyOwner {
        dailyLimit = newLimit;
        emit DailyLimitUpdated(newLimit);
    }

    /// @notice Admin: pause contract in emergency
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function _buildTxHash(
        address from,
        address to,
        uint256 amount,
        TxType txType
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            from, to, amount, block.timestamp, txType, allTransactions.length
        ));
    }

    function _recordTx(
        address from,
        address to,
        uint256 amount,
        TxType txType,
        bytes32 txHash
    ) internal {
        Transaction memory tx_ = Transaction({
            from: from,
            to: to,
            amount: amount,
            timestamp: block.timestamp,
            txType: txType,
            txHash: txHash
        });
        userTxHistory[from].push(tx_);
        allTransactions.push(tx_);
    }
}
