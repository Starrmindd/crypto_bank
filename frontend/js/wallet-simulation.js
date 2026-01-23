// Banking DApp Wallet Simulation
class WalletSimulation {
    constructor() {
        this.isConnected = false;
        this.userAccount = null;
        this.userID = null;
        this.balance = 0;
        this.transactions = [];
        this.visibleTransactions = 4;
        
        this.initializeSimulation();
    }

    initializeSimulation() {
        // Generate realistic sample data
        this.generateSampleTransactions();
        this.updateUI();
    }

    generateSampleTransactions() {
        const sampleTransactions = [
            {
                type: 'Deposit',
                amount: 2.5,
                recipient: 'Your Wallet',
                sender: 'Bank Transfer',
                timestamp: Date.now() - 3600000, // 1 hour ago
                hash: '0x' + this.generateRandomHash(),
                status: 'Completed'
            },
            {
                type: 'Transfer',
                amount: 0.8,
                recipient: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
                sender: 'Your Wallet',
                timestamp: Date.now() - 7200000, // 2 hours ago
                hash: '0x' + this.generateRandomHash(),
                status: 'Completed'
            },
            {
                type: 'Withdraw',
                amount: 1.2,
                recipient: 'Bank Account',
                sender: 'Your Wallet',
                timestamp: Date.now() - 86400000, // 1 day ago
                hash: '0x' + this.generateRandomHash(),
                status: 'Completed'
            }
        ];
        
        this.transactions = sampleTransactions;
        this.balance = 5.7432; // Starting balance
    }
    generateRandomHash() {
        return Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    generateRandomAddress() {
        return '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    generateUserID() {
        return 'USR-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    showLoading(message = 'Processing...') {
        document.getElementById('loadingText').textContent = message;
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.style.background = type === 'success' ? '#28a745' : '#dc3545';
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    updateUI() {
        // Update balance
        document.getElementById('ethBalance').textContent = `${this.balance.toFixed(4)} ETH`;
        
        // Update user info
        if (this.isConnected) {
            document.getElementById('userAddress').textContent = 
                `Hello, ${this.userAccount.slice(0, 5)}...${this.userAccount.slice(-4)}!`;
            document.getElementById('userID').textContent = `User ID: ${this.userID}`;
            document.getElementById('connectBtn').innerHTML = 
                '<i class="fa-solid fa-check"></i> Connected';
            document.getElementById('connectBtn').style.background = '#28a745';
        }
        
        // Update transactions
        this.updateTransactionUI();
    }
    updateTransactionUI() {
        const transactionList = document.getElementById('transactionList');
        transactionList.innerHTML = '';
        
        const displayedTransactions = this.transactions.slice(0, 
            Math.min(this.visibleTransactions, this.transactions.length));

        displayedTransactions.forEach(tx => {
            const color = this.getTransactionColor(tx.type);
            const icon = this.getTransactionIcon(tx.type);
            
            transactionList.innerHTML += `
                <div class="transaction" style="border-bottom: 1px solid #ddd; padding: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <p style="margin: 0; font-weight: bold;">
                                <i class="${icon}" style="margin-right: 8px; color: ${color};"></i>
                                ${tx.type}
                            </p>
                            <p style="margin: 0; font-size: 12px; color: black;">
                                ${tx.type === 'Transfer' ? 'To: ' : ''}${tx.recipient.slice(0, 20)}${tx.recipient.length > 20 ? '...' : ''}
                            </p>
                            <small style="color: black;">${new Date(tx.timestamp).toLocaleString()}</small>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 0; font-weight: bold; color: ${color};">
                                ${tx.type === 'Deposit' ? '+' : '-'}${tx.amount} ETH
                            </p>
                            <small style="color: #28a745;">${tx.status}</small>
                        </div>
                    </div>
                </div>
            `;
        });

        // Show/hide buttons
        document.getElementById('seeMoreBtn').style.display = 
            this.visibleTransactions < this.transactions.length ? 'block' : 'none';
        document.getElementById('seeLessBtn').style.display = 
            this.visibleTransactions > 4 ? 'block' : 'none';
    }

    getTransactionColor(type) {
        switch(type) {
            case 'Deposit': return '#28a745'; // Green - good contrast
            case 'Withdraw': return '#007bff'; // Blue - good contrast  
            case 'Transfer': return '#dc3545'; // Red - good contrast
            default: return '#343a40'; // Dark gray - good contrast
        }
    }

    getTransactionIcon(type) {
        switch(type) {
            case 'Deposit': return 'fa-solid fa-arrow-down';
            case 'Withdraw': return 'fa-solid fa-arrow-up';
            case 'Transfer': return 'fa-solid fa-paper-plane';
            default: return 'fa-solid fa-exchange-alt';
        }
    }
    async simulateTransaction(type, amount, recipient = null) {
        this.showLoading(`Processing ${type.toLowerCase()}...`);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const transaction = {
            type: type,
            amount: parseFloat(amount),
            recipient: recipient || (type === 'Deposit' ? 'Your Wallet' : 'External'),
            sender: type === 'Deposit' ? 'Bank Transfer' : 'Your Wallet',
            timestamp: Date.now(),
            hash: '0x' + this.generateRandomHash(),
            status: 'Completed'
        };
        
        // Update balance
        if (type === 'Deposit') {
            this.balance += parseFloat(amount);
        } else {
            this.balance -= parseFloat(amount);
        }
        
        // Add transaction to history
        this.transactions.unshift(transaction);
        
        this.hideLoading();
        this.updateUI();
        
        // Add success animation
        document.querySelector('.balance').classList.add('success-animation');
        setTimeout(() => {
            document.querySelector('.balance').classList.remove('success-animation');
        }, 600);
        
        this.showNotification(`${type} of ${amount} ETH completed successfully!`);
        
        return transaction;
    }
}

// Initialize simulation
const walletSim = new WalletSimulation();

// Global functions for UI interaction
async function connectWallet() {
    if (walletSim.isConnected) return;
    
    walletSim.showLoading('Connecting to wallet...');
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate simulated wallet data
    walletSim.userAccount = walletSim.generateRandomAddress();
    walletSim.userID = walletSim.generateUserID();
    walletSim.isConnected = true;
    
    walletSim.hideLoading();
    walletSim.updateUI();
    walletSim.showNotification('Wallet connected successfully!');
}
async function depositFunds() {
    if (!walletSim.isConnected) {
        walletSim.showNotification('Please connect your wallet first!', 'error');
        return;
    }
    
    const amount = prompt('Enter amount to deposit in ETH:');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        walletSim.showNotification('Invalid amount entered!', 'error');
        return;
    }
    
    await walletSim.simulateTransaction('Deposit', amount);
}

async function withdrawFunds() {
    if (!walletSim.isConnected) {
        walletSim.showNotification('Please connect your wallet first!', 'error');
        return;
    }
    
    const amount = document.getElementById('withdrawAmount').value;
    if (!amount || parseFloat(amount) <= 0) {
        walletSim.showNotification('Please enter a valid amount!', 'error');
        return;
    }
    
    if (parseFloat(amount) > walletSim.balance) {
        walletSim.showNotification('Insufficient balance!', 'error');
        return;
    }
    
    await walletSim.simulateTransaction('Withdraw', amount);
    closeModal('withdrawModal');
    document.getElementById('withdrawAmount').value = '';
}

async function transferFunds() {
    if (!walletSim.isConnected) {
        walletSim.showNotification('Please connect your wallet first!', 'error');
        return;
    }
    
    const recipient = document.getElementById('transferAddress').value;
    const amount = document.getElementById('transferAmount').value;
    
    if (!recipient || !amount || parseFloat(amount) <= 0) {
        walletSim.showNotification('Please enter valid recipient and amount!', 'error');
        return;
    }
    
    if (parseFloat(amount) > walletSim.balance) {
        walletSim.showNotification('Insufficient balance!', 'error');
        return;
    }
    
    // Validate address format (basic check)
    if (!recipient.startsWith('0x') && !recipient.startsWith('USR-')) {
        walletSim.showNotification('Invalid address format!', 'error');
        return;
    }
    
    await walletSim.simulateTransaction('Transfer', amount, recipient);
    closeModal('transferModal');
    document.getElementById('transferAddress').value = '';
    document.getElementById('transferAmount').value = '';
}
function loadMoreTransactions() {
    walletSim.visibleTransactions += 4;
    walletSim.updateTransactionUI();
}

function collapseTransactions() {
    walletSim.visibleTransactions = 4;
    walletSim.updateTransactionUI();
}

function openModal(id) {
    if (!walletSim.isConnected) {
        walletSim.showNotification('Please connect your wallet first!', 'error');
        return;
    }
    document.getElementById(id).style.display = 'block';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Add more sample transactions periodically for demo
setInterval(() => {
    if (walletSim.isConnected && Math.random() < 0.1) { // 10% chance every 30 seconds
        const types = ['Deposit', 'Transfer'];
        const type = types[Math.floor(Math.random() * types.length)];
        const amount = (Math.random() * 2 + 0.1).toFixed(4);
        
        const transaction = {
            type: type,
            amount: parseFloat(amount),
            recipient: type === 'Deposit' ? 'Your Wallet' : walletSim.generateRandomAddress(),
            sender: type === 'Deposit' ? 'Auto-Deposit' : 'Your Wallet',
            timestamp: Date.now(),
            hash: '0x' + walletSim.generateRandomHash(),
            status: 'Completed'
        };
        
        if (type === 'Deposit') {
            walletSim.balance += parseFloat(amount);
            walletSim.transactions.unshift(transaction);
            walletSim.updateUI();
            walletSim.showNotification(`Auto-deposit of ${amount} ETH received!`);
        }
    }
}, 30000);

// Initialize UI on page load
document.addEventListener('DOMContentLoaded', () => {
    // Auto-connect after 2 seconds for demo purposes
    setTimeout(() => {
        if (!walletSim.isConnected) {
            connectWallet();
        }
    }, 2000);
});