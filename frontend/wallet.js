// Connect to Ethereum
async function connectWallet() {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();
        document.getElementById("walletAddress").innerText = accounts[0];
        return accounts[0];
    } else {
        alert("Please install MetaMask to use this feature.");
        return null;
    }
}

// Smart contract setup
const contractAddress = "YOUR_SMART_CONTRACT_ADDRESS";
const contractABI = [YOUR_CONTRACT_ABI]; // Replace with your ABI
let contract;

async function initContract() {
    if (!window.web3) await connectWallet();
    contract = new web3.eth.Contract(contractABI, contractAddress);
}

// Deposit funds
async function deposit(amount) {
    const account = await connectWallet();
    if (!account) return;
    await contract.methods.deposit().send({ from: account, value: web3.utils.toWei(amount, "ether") });
    alert("Deposit successful!");
}

// Withdraw funds
async function withdraw(amount) {
    const account = await connectWallet();
    if (!account) return;
    await contract.methods.withdraw(web3.utils.toWei(amount, "ether")).send({ from: account });
    alert("Withdrawal successful!");
}

// Transfer funds
async function transfer(toAddress, amount) {
    const account = await connectWallet();
    if (!account) return;
    await contract.methods.transfer(toAddress, web3.utils.toWei(amount, "ether")).send({ from: account });
    alert("Transfer successful!");
}

// Check balance
async function getBalance() {
    const account = await connectWallet();
    if (!account) return;
    const balance = await contract.methods.getBalance().call({ from: account });
    document.getElementById("balance").innerText = web3.utils.fromWei(balance, "ether") + " ETH";
}
