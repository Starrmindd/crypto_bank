// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract ChaoticECCAnchoring is AccessControl {
    bytes32 public constant GATEWAY_ROLE = keccak256("GATEWAY");

    struct Anchor {
        bytes32 anchorHash;
        address owner;
        uint256 timestamp;
        string ipfsCID;
    }

    mapping(bytes32 => Anchor) private anchors;

    event AnchorStored(
        bytes32 indexed txID,
        bytes32 anchorHash,
        address indexed owner,
        string ipfsCID
    );

    constructor(address gateway) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(GATEWAY_ROLE, gateway);
    }

    function storeAnchor(
        bytes32 txID,
        bytes32 anchorHash,
        address owner,
        string calldata ipfsCID
    ) external onlyRole(GATEWAY_ROLE) {
        require(anchors[txID].timestamp == 0, "Anchor exists");
        anchors[txID] = Anchor(anchorHash, owner, block.timestamp, ipfsCID);
        emit AnchorStored(txID, anchorHash, owner, ipfsCID);
    }

    function getAnchor(bytes32 txID)
        external
        view
        returns (
            bytes32 anchorHash,
            address owner,
            uint256 timestamp,
            string memory ipfsCID
        )
    {
        Anchor memory a = anchors[txID];
        return (a.anchorHash, a.owner, a.timestamp, a.ipfsCID);
    }

    function verify(bytes32 txID, bytes32 candidateAnchor)
        external
        view
        returns (bool)
    {
        return anchors[txID].anchorHash == candidateAnchor;
    }
}
