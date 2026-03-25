// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title TransactionAudit
/// @notice Stores cryptographic audit proofs for off-chain transaction verification
/// @dev Works alongside ChaoticECCAnchoring — this handles the audit trail layer
contract TransactionAudit is AccessControl {
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR");
    bytes32 public constant GATEWAY_ROLE = keccak256("GATEWAY");

    struct AuditRecord {
        bytes32 txHash;
        bytes32 chaoticFingerprint;
        bytes32 encryptedTraceRef;  // IPFS CID hash or encrypted pointer
        address submittedBy;
        uint256 timestamp;
        bool flagged;
        string flagReason;
    }

    mapping(bytes32 => AuditRecord) private records;
    bytes32[] private recordIndex;

    uint256 public totalRecords;
    uint256 public flaggedCount;

    event AuditRecordStored(bytes32 indexed txHash, bytes32 fingerprint, uint256 timestamp);
    event RecordFlagged(bytes32 indexed txHash, string reason, address flaggedBy);
    event RecordCleared(bytes32 indexed txHash, address clearedBy);

    constructor(address admin, address gateway) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(AUDITOR_ROLE, admin);
        _setupRole(GATEWAY_ROLE, gateway);
    }

    /// @notice Store an audit record — called by the backend gateway
    function storeAuditRecord(
        bytes32 txHash,
        bytes32 chaoticFingerprint,
        bytes32 encryptedTraceRef
    ) external onlyRole(GATEWAY_ROLE) {
        require(records[txHash].timestamp == 0, "Record exists");

        records[txHash] = AuditRecord({
            txHash: txHash,
            chaoticFingerprint: chaoticFingerprint,
            encryptedTraceRef: encryptedTraceRef,
            submittedBy: msg.sender,
            timestamp: block.timestamp,
            flagged: false,
            flagReason: ""
        });

        recordIndex.push(txHash);
        totalRecords++;

        emit AuditRecordStored(txHash, chaoticFingerprint, block.timestamp);
    }

    /// @notice Auditor flags a suspicious transaction
    function flagRecord(bytes32 txHash, string calldata reason)
        external
        onlyRole(AUDITOR_ROLE)
    {
        require(records[txHash].timestamp != 0, "Record not found");
        require(!records[txHash].flagged, "Already flagged");

        records[txHash].flagged = true;
        records[txHash].flagReason = reason;
        flaggedCount++;

        emit RecordFlagged(txHash, reason, msg.sender);
    }

    /// @notice Auditor clears a previously flagged record
    function clearFlag(bytes32 txHash) external onlyRole(AUDITOR_ROLE) {
        require(records[txHash].flagged, "Not flagged");
        records[txHash].flagged = false;
        records[txHash].flagReason = "";
        flaggedCount--;

        emit RecordCleared(txHash, msg.sender);
    }

    /// @notice Verify a transaction's chaotic fingerprint matches stored record
    function verifyFingerprint(bytes32 txHash, bytes32 candidateFingerprint)
        external
        view
        returns (bool)
    {
        return records[txHash].chaoticFingerprint == candidateFingerprint;
    }

    /// @notice Get full audit record
    function getRecord(bytes32 txHash)
        external
        view
        returns (AuditRecord memory)
    {
        require(records[txHash].timestamp != 0, "Record not found");
        return records[txHash];
    }

    /// @notice Get paginated list of record hashes
    function getRecords(uint256 offset, uint256 limit)
        external
        view
        returns (bytes32[] memory)
    {
        uint256 end = offset + limit > recordIndex.length
            ? recordIndex.length
            : offset + limit;

        bytes32[] memory page = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = recordIndex[i];
        }
        return page;
    }
}
