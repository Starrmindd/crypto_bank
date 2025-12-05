let web3;
let contract;
let userAccount;
let transactions = [];
let visibleTransactions = 4; // Initial transactions to show

const contractABI = [
	{
		"inputs": [],
		"name": "deposit",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "ECDSAInvalidSignature",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "length",
				"type": "uint256"
			}
		],
		"name": "ECDSAInvalidSignatureLength",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "s",
				"type": "bytes32"
			}
		],
		"name": "ECDSAInvalidSignatureS",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "uniqueID",
				"type": "string"
			},
			{
				"internalType": "bytes32",
				"name": "hash",
				"type": "bytes32"
			},
			{
				"internalType": "bytes",
				"name": "signature",
				"type": "bytes"
			}
		],
		"name": "login",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "success",
				"type": "bool"
			}
		],
		"name": "LoginAttempt",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "miner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "nonce",
				"type": "uint256"
			}
		],
		"name": "ProofOfWorkValidated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_username",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_NIN",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_BVN",
				"type": "string"
			}
		],
		"name": "registerUser",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bytes32",
				"name": "hash",
				"type": "bytes32"
			}
		],
		"name": "TransactionRecorded",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "recipientID",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "signature",
				"type": "bytes"
			},
			{
				"internalType": "uint256",
				"name": "nonce",
				"type": "uint256"
			}
		],
		"name": "transferFunds",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "uniqueID",
				"type": "string"
			}
		],
		"name": "UserRegistered",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "allTransactions",
		"outputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "signature",
				"type": "bytes"
			},
			{
				"internalType": "bytes32",
				"name": "hash",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "nonce",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "balances",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "idToAddress",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "users",
		"outputs": [
			{
				"internalType": "string",
				"name": "username",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "NIN",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "BVN",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "uniqueID",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "isRegistered",
				"type": "bool"
			},
			{
				"internalType": "address",
				"name": "userAddress",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "userTransactions",
		"outputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "signature",
				"type": "bytes"
			},
			{
				"internalType": "bytes32",
				"name": "hash",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "nonce",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const contractAddress = "0x2B13Fdb0AB49D0997b5462e8B8Dd55Ea9dFB5486"; // Replace with your deployed contract address

// Connect to MetaMask
async function connectMetaMask() {
    if (window.ethereum) {
        try {
            web3 = new Web3(window.ethereum);
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            userAccount = accounts[0];

            // Load the smart contract
            contract = new web3.eth.Contract(contractABI, contractAddress);

            document.getElementById("userAddress").innerText = `Hello, ${userAccount.slice(0, 6)}...${userAccount.slice(-4)}`;

            fetchUserDetails();
            fetchBalance();
            fetchTransactions();
        } catch (error) {
            console.error("MetaMask connection failed:", error);
            alert("Failed to connect to MetaMask.");
        }
    } else {
        alert("Please install MetaMask!");
    }
}

// Fetch User Details
async function fetchUserDetails() {
    try {
        const user = await contract.methods.users(userAccount).call();
        
        if (user.isRegistered) {
            document.getElementById("userID").innerText = `User ID: ${user.uniqueID}`;
        } else {
            alert("User not found. Please sign up first.");
            window.location.href = "sign_up.html";
        }
    } catch (error) {
        console.error("Error fetching user details:", error);
    }
}

// Fetch ETH Balance
async function fetchBalance() {
    try {
        const balanceWei = await web3.eth.getBalance(userAccount);
        const balanceEth = web3.utils.fromWei(balanceWei, "ether");
        document.getElementById("ethBalance").innerText = `${parseFloat(balanceEth).toFixed(4)} ETH`;
    } catch (error) {
        console.error("Error fetching balance:", error);
    }
}

// Deposit Funds
async function depositFunds() {
    const amount = prompt("Enter deposit amount (ETH):");
    if (!amount || isNaN(amount) || amount <= 0) {
        alert("Invalid amount.");
        return;
    }

    try {
        await contract.methods.deposit().send({
            from: userAccount,
            value: web3.utils.toWei(amount, "ether")
        });

        alert("Deposit Successful!");
        fetchBalance();
        fetchTransactions();
    } catch (error) {
        console.error("Deposit Failed:", error);
    }
}

// Withdraw Funds
async function withdrawFunds() {
    const amount = document.getElementById("withdrawAmount").value;
    if (!amount || isNaN(amount) || amount <= 0) {
        alert("Invalid amount.");
        return;
    }

    try {
        await contract.methods.withdraw(web3.utils.toWei(amount, "ether")).send({ from: userAccount });

        alert("Withdrawal Successful!");
        closeModal('withdrawModal');
        fetchBalance();
        fetchTransactions();
    } catch (error) {
        console.error("Withdrawal Failed:", error);
    }
}

// Transfer Funds Using Unique ID
async function transferFunds() {
    const recipientID = document.getElementById("recipientID").value;
    const amount = document.getElementById("transferAmount").value;

    if (!recipientID) {
        alert("Please enter the recipient's Unique ID.");
        return;
    }
    if (!amount || isNaN(amount) || amount <= 0) {
        alert("Invalid amount.");
        return;
    }

    const nonce = Math.floor(Math.random() * 100000); // Generate a random nonce
    const hash = web3.utils.soliditySha3(userAccount, recipientID, amount, nonce);
    const signature = await web3.eth.personal.sign(hash, userAccount);

    try {
        await contract.methods.transferFunds(recipientID, web3.utils.toWei(amount, "ether"), signature, nonce)
            .send({ from: userAccount });

        alert("Transfer Successful!");
        closeModal('transferModal');
        fetchBalance();
        fetchTransactions();
    } catch (error) {
        console.error("Transfer Failed:", error);
    }
}

// Load Dashboard Data
window.addEventListener("load", connectMetaMask);
