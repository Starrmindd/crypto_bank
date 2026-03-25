// Dashboard — MetaMask connection, balance, deposit/withdraw/transfer, transaction history
let web3;
let contract;
let userAccount;
let transactions = [];
let visibleTransactions = 4;

async function connectMetaMask() {
  if (!window.ethereum) return alert('Please install MetaMask.');
  try {
    web3 = new Web3(window.ethereum);
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    userAccount = accounts[0];
    contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

    document.getElementById('userAddress').innerText =
      `Hello, ${userAccount.slice(0, 6)}...${userAccount.slice(-4)}`;

    const userData = await contract.methods.users(userAccount).call();
    document.getElementById('userID').innerText = userData.isRegistered
      ? `User ID: ${userData.uniqueID}`
      : 'User ID: Not Registered';

    getBalance();
    getTransactionHistory();
  } catch (err) {
    console.error('MetaMask connection failed:', err);
  }
}

async function getBalance() {
  if (!userAccount) return;
  try {
    const balance = await web3.eth.getBalance(userAccount);
    document.getElementById('ethBalance').innerText =
      `${parseFloat(web3.utils.fromWei(balance, 'ether')).toFixed(4)} ETH`;
  } catch (err) {
    console.error('Balance fetch failed:', err);
  }
}

async function depositFunds() {
  if (!userAccount || !contract) return;
  const amount = prompt('Enter amount to deposit in ETH:');
  if (!amount || isNaN(amount) || amount <= 0) return;
  try {
    await contract.methods.deposit().send({
      from: userAccount,
      value: web3.utils.toWei(amount, 'ether'),
    });
    getBalance();
    getTransactionHistory();
  } catch (err) {
    console.error('Deposit failed:', err);
  }
}

async function withdrawFunds() {
  const amount = document.getElementById('withdrawAmount').value;
  if (!amount || amount <= 0) return alert('Invalid amount.');
  try {
    const contractBalance = await contract.methods.balances(userAccount).call();
    if (parseFloat(web3.utils.fromWei(contractBalance, 'ether')) < amount) {
      return alert('Insufficient balance. Deposit first.');
    }
    await contract.methods
      .withdraw(web3.utils.toWei(amount, 'ether'))
      .send({ from: userAccount });
    alert(`Withdrawn ${amount} ETH`);
    getBalance();
    getTransactionHistory();
    closeModal('withdrawModal');
  } catch (err) {
    console.error('Withdrawal failed:', err);
  }
}

async function transferFunds() {
  const recipient = document.getElementById('transferAddress').value;
  const amount = document.getElementById('transferAmount').value;
  if (!recipient || amount <= 0) return alert('Invalid recipient or amount.');
  try {
    const senderBalance = await contract.methods.balances(userAccount).call();
    if (parseFloat(web3.utils.fromWei(senderBalance, 'ether')) < amount) {
      return alert('Insufficient balance. Deposit first.');
    }
    await contract.methods
      .transferFunds(recipient, web3.utils.toWei(amount, 'ether'))
      .send({ from: userAccount });
    alert(`Transferred ${amount} ETH to ${recipient}`);
    getBalance();
    getTransactionHistory();
    closeModal('transferModal');
  } catch (err) {
    console.error('Transfer failed:', err);
  }
}

async function getTransactionHistory() {
  if (!userAccount || !contract) return;
  try {
    transactions = await contract.methods.getTransactions(userAccount).call();
    transactions.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    renderTransactions();
  } catch (err) {
    console.error('Transaction fetch failed:', err);
  }
}

function renderTransactions() {
  const list = document.getElementById('transactionList');
  list.innerHTML = '';
  const visible = transactions.slice(0, Math.min(visibleTransactions, transactions.length));

  const colors = { Deposit: '#1dd81d', Withdraw: 'blue', Transfer: 'red' };

  visible.forEach(tx => {
    const eth = web3.utils.fromWei(tx.amount.toString(), 'ether');
    const time = new Date(Number(tx.timestamp) * 1000).toLocaleString();
    const color = colors[tx.txType] || 'black';
    list.innerHTML += `
      <div class="transaction">
        <p><strong>${tx.txType}</strong> → ${tx.recipient.slice(0, 6)}...${tx.recipient.slice(-4)}</p>
        <p style="font-weight:bold;color:${color}">${eth} ETH</p>
        <small>${time}</small>
      </div>`;
  });

  document.getElementById('seeMoreBtn').style.display =
    visibleTransactions < transactions.length ? 'block' : 'none';
  document.getElementById('seeLessBtn').style.display =
    visibleTransactions > 4 ? 'block' : 'none';
}

function loadMoreTransactions() { visibleTransactions += 4; renderTransactions(); }
function collapseTransactions() { visibleTransactions = 4; renderTransactions(); }
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

window.addEventListener('load', connectMetaMask);
