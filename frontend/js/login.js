// Login — MetaMask signature-based authentication
const LOGIN_CONTRACT_ADDRESS = "0x660B31DF8067DA46A947AaB730C98772757279db";

let web3, contract, userAccount;

async function connectMetaMask() {
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  userAccount = accounts[0];
}

async function loginUser() {
  await connectMetaMask();
  const uniqueID = document.getElementById('uniqueID').value;
  if (!uniqueID) return alert('Please enter your unique ID.');

  try {
    web3 = new Web3(window.ethereum);
    contract = new web3.eth.Contract(CONTRACT_ABI, LOGIN_CONTRACT_ADDRESS);

    const message = web3.utils.soliditySha3(uniqueID, userAccount);
    const signature = await web3.eth.personal.sign(message, userAccount, '');
    const isLoggedIn = await contract.methods.login(uniqueID, signature).call();

    if (isLoggedIn) {
      alert('Login successful!');
      window.location.href = 'dashboard.html';
    } else {
      document.getElementById('loginMessage').style.display = 'block';
    }
  } catch (err) {
    console.error('Login failed:', err);
  }
}
