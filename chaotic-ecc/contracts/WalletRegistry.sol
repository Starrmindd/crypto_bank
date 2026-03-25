// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title WalletRegistry
/// @notice Manages user wallet registration, KYC status, and identity binding
contract WalletRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public constant KYC_ROLE = keccak256("KYC_OFFICER");

    enum KYCStatus { None, Pending, Approved, Rejected }

    struct UserProfile {
        string username;
        bytes32 ninHash;      // hashed NIN — never store raw PII on-chain
        bytes32 bvnHash;      // hashed BVN
        string uniqueID;
        KYCStatus kycStatus;
        bool isActive;
        uint256 registeredAt;
        address walletAddress;
    }

    mapping(address => UserProfile) private profiles;
    mapping(string => address) private idToAddress;
    mapping(bytes32 => bool) private usedNINs;
    mapping(bytes32 => bool) private usedBVNs;

    uint256 public totalUsers;

    event UserRegistered(address indexed user, string uniqueID, uint256 timestamp);
    event KYCUpdated(address indexed user, KYCStatus status);
    event UserDeactivated(address indexed user);

    constructor(address admin) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(ADMIN_ROLE, admin);
    }

    /// @notice Register a new user with hashed identity data
    function registerUser(
        string calldata username,
        bytes32 ninHash,
        bytes32 bvnHash
    ) external nonReentrant {
        require(!profiles[msg.sender].isActive, "Already registered");
        require(!usedNINs[ninHash], "NIN already registered");
        require(!usedBVNs[bvnHash], "BVN already registered");
        require(bytes(username).length >= 3, "Username too short");

        string memory uid = _generateUID(msg.sender, username);

        profiles[msg.sender] = UserProfile({
            username: username,
            ninHash: ninHash,
            bvnHash: bvnHash,
            uniqueID: uid,
            kycStatus: KYCStatus.Pending,
            isActive: true,
            registeredAt: block.timestamp,
            walletAddress: msg.sender
        });

        idToAddress[uid] = msg.sender;
        usedNINs[ninHash] = true;
        usedBVNs[bvnHash] = true;
        totalUsers++;

        emit UserRegistered(msg.sender, uid, block.timestamp);
    }

    /// @notice KYC officer updates a user's KYC status
    function updateKYC(address user, KYCStatus status)
        external
        onlyRole(KYC_ROLE)
    {
        require(profiles[user].isActive, "User not found");
        profiles[user].kycStatus = status;
        emit KYCUpdated(user, status);
    }

    /// @notice Deactivate a user account
    function deactivateUser(address user) external onlyRole(ADMIN_ROLE) {
        require(profiles[user].isActive, "User not active");
        profiles[user].isActive = false;
        emit UserDeactivated(user);
    }

    /// @notice Get user profile (public fields only)
    function getProfile(address user)
        external
        view
        returns (
            string memory username,
            string memory uniqueID,
            KYCStatus kycStatus,
            bool isActive,
            uint256 registeredAt
        )
    {
        UserProfile memory p = profiles[user];
        return (p.username, p.uniqueID, p.kycStatus, p.isActive, p.registeredAt);
    }

    /// @notice Resolve a uniqueID to a wallet address
    function resolveID(string calldata uid) external view returns (address) {
        return idToAddress[uid];
    }

    /// @notice Check if a user has passed KYC
    function isKYCApproved(address user) external view returns (bool) {
        return profiles[user].kycStatus == KYCStatus.Approved;
    }

    function _generateUID(address user, string memory username)
        internal
        view
        returns (string memory)
    {
        bytes32 hash = keccak256(
            abi.encodePacked(user, username, block.timestamp, totalUsers)
        );
        // return first 12 hex chars as UID
        bytes memory hexChars = "0123456789abcdef";
        bytes memory uid = new bytes(12);
        for (uint i = 0; i < 6; i++) {
            uid[i * 2]     = hexChars[uint8(hash[i]) >> 4];
            uid[i * 2 + 1] = hexChars[uint8(hash[i]) & 0x0f];
        }
        return string(uid);
    }
}
