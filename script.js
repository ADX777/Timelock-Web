let allCoins = [];

const alphaKey = '58M61D2ZINADHSE2';
const twelveKey = '7f6d53f6d70e4c0e803d8efd66fb32f3';

let hasNoteError = false;

let authSig = null; // Lưu authSig sau khi connect
let provider = null; // Lưu provider ethers.js

async function connectWallet() {
  try {
    if (!window.ethereum) throw new Error("Vui lòng cài MetaMask!");
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: 'binanceSmartChain' });
    document.getElementById("walletStatus").textContent = `Trạng thái: Đã kết nối (${address.substring(0, 6)}...${address.substring(address.length - 4)})`;
    document.getElementById("walletStatusDecrypt").textContent = `Trạng thái: Đã kết nối (${address.substring(0, 6)}...${address.substring(address.length - 4)})`;
    document.getElementById("connectButton").disabled = true;
    document.getElementById("connectButtonDecrypt").disabled = true;
    console.log('Ví đã kết nối!');
  } catch (error) {
    console.error('Lỗi connect ví:', error);
    alert('Lỗi connect ví: ' + error.message);
  }
}

async function loadCoinList() {
  // Giữ nguyên code loadCoinList
  try {
    const res = await fetch("https://api.binance.com/api/v3/exchangeInfo");
    const data = await res.json();
    allCoins = data.symbols
      .filter(s => s.symbol.endsWith("USDT"))
      .map(s => s.symbol);
    const forexBases = ['EUR', 'GBP', 'USD', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF', 'XAU'];
    allCoins = allCoins.filter(symbol => !forexBases.includes(symbol.slice(0, -4)));
    allCoins.push('EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD');
    allCoins.push('EUR/JPY', 'GBP/JPY', 'EUR/GBP', 'EUR/CAD', 'EUR/AUD', 'EUR/NZD', 'GBP/AUD', 'GBP/CAD', 'NZD/CAD', 'USD/CAD', 'USD/CHF');
    allCoins.push('AUD/USD', 'AUD/NZD', 'AUD/CAD', 'AUD/JPY', 'NZD/USD', 'NZD/JPY');
    allCoins.sort();
  } catch (e) {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1');
      const data = await res.json();
      allCoins = data.map(coin => coin.symbol.toUpperCase() + 'USDT');
      const forexBases = ['EUR', 'GBP', 'USD', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF', 'XAU'];
      allCoins = allCoins.filter(symbol => !forexBases.includes(symbol.slice(0, -4)));
      allCoins.push('EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD');
      allCoins.push('EUR/JPY', 'GBP/JPY', 'EUR/GBP', 'EUR/CAD', 'EUR/AUD', 'EUR/NZD', 'GBP/AUD', 'GBP/CAD', 'NZD/CAD', 'USD/CAD', 'USD/CHF');
      allCoins.push('AUD/USD', 'AUD/NZD', 'AUD/CAD', 'AUD/JPY', 'NZD/USD', 'NZD/JPY');
      allCoins.sort();
    } catch (innerE) {}
  }
}
loadCoinList();

// Giữ nguyên suggestCoins, fetchWithRetry, getPrice, fetchPrice, getBinanceTime, sha256, sha256Bytes

// Khởi tạo Lit
const litClient = new LitJsSdk.LitNodeClient({ litNetwork: 'datil-dev' });
async function connectLit() {
    await litClient.connect();
    console.log('Lit connected');
}
connectLit();

// Oracle examples
const chainlinkOracles = {
    'BTCUSDT': '0x0567F2323251f0Aab15c8dFb1967e4e8A7D42aEe',
    'ETHUSDT': '0x9ef1B8c0E4F7dc8173CE3516B9230823Bd323689',
};

// Contract time (deploy và thay)
const timeLockContract = 'YOUR_TIMELock_CONTRACT_ADDRESS';

async function encrypt() {
  if (!authSig) {
    alert('Vui lòng connect ví trước khi mã hóa!');
    return;
  }

  const note = document.getElementById("noteInput").value;
  const coin = document.getElementById("coinInput").value.toUpperCase();
  const priceInput = document.getElementById("targetPrice").value.trim();
  const minPriceInput = document.getElementById("minPrice").value.trim();
  const unlockLocalString = document.getElementById("unlockTime").value.trim();

  try {
    // Validation
    if (!note || !coin || !priceInput || !unlockLocalString) throw new Error("Nhập đầy đủ thông tin!");
    if (!allCoins.includes(coin)) throw new Error("Coin không hợp lệ!");
    const unlockDate = new Date(unlockLocalString);
    const now = await getBinanceTime() || new Date();
    if (unlockDate <= now) throw new Error("Thời gian mở khóa không hợp lệ!");

    const price = parseFloat(priceInput);
    const minPrice = minPriceInput ? parseFloat(minPriceInput) : null;
    const oracleAddress = chainlinkOracles[coin] || '0x0567F2323251f0Aab15c8dFb1967e4e8A7D42aEe';

    const conditions = [
      {
        contractAddress: oracleAddress,
        standardContractType: '',
        chain: 'binanceSmartChain',
        method: 'latestAnswer',
        parameters: [],
        returnValueTest: { comparator: '>=', value: (price * 1e8).toString() }
      },
      { operator: 'and' },
      {
        contractAddress: timeLockContract,
        standardContractType: '',
        chain: 'binanceSmartChain',
        method: 'isUnlocked',
        parameters: [Math.floor(unlockDate.getTime() / 1000).toString()],
        returnValueTest: { comparator: '==', value: 'true' }
      }
    ];

    if (minPrice) {
      conditions.unshift({
        contractAddress: oracleAddress,
        standardContractType: '',
        chain: 'binanceSmartChain',
        method: 'latestAnswer',
        parameters: [],
        returnValueTest: { comparator: '<=', value: (minPrice * 1e8).toString() }
      });
      conditions.unshift({ operator: 'and' });
    }

    const { ciphertext, dataToEncryptHash } = await LitJsSdk.encryptString(
      {
        accessControlConditions: conditions,
        chain: 'binanceSmartChain',
        dataToEncrypt: note,
        authSig
      },
      litClient
    );

    const output = `ENC[${ciphertext},${dataToEncryptHash}]`;
    document.getElementById("encryptedOutput").value = output;
    document.getElementById("encryptedOutput").classList.add('frozen-effect');

  } catch (error) {
    console.error('Lỗi mã hóa:', error);
    document.getElementById("encryptedOutput").value = `❌ Lỗi: ${error.message}`;
  }
}

async function decrypt() {
  if (!authSig) {
    alert('Vui lòng connect ví trước khi giải mã!');
    return;
  }

  const decryptButton = document.getElementById("decryptButton");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const resultElement = document.getElementById("decryptedResult");

  decryptButton.disabled = true;
  loadingIndicator.style.display = "block";
  resultElement.innerHTML = "";

  try {
    const input = document.getElementById("decryptionInput").value.trim();
    if (!input.startsWith("ENC[") || !input.endsWith("]")) throw new Error("Mã không đúng định dạng!");

    const [, ciphertext, dataToEncryptHash] = input.match(/ENC\[(.+),(.+)\]/) || [];
    if (!ciphertext || !dataToEncryptHash) throw new Error("Mã không hợp lệ!");

    const decrypted = await LitJsSdk.decryptString(
      ciphertext,
      dataToEncryptHash,
      { chain: 'binanceSmartChain', authSig },
      litClient
    );

    // Tính phí
    const days = 1; // Hoặc từ logic bạn muốn
    const fee = 0.5 * days;
    await payUSDT(fee);

    resultElement.innerHTML = `<div class="note-label">Ghi chú:</div><div class="note-content">${decrypted}</div>`;
    resultElement.classList.add('success-border');
    const successMsg = document.createElement('div');
    successMsg.id = 'successMsg';
    successMsg.textContent = 'Giải mã thành công';
    resultElement.appendChild(successMsg);
    setTimeout(() => {
      successMsg.style.opacity = 0;
      setTimeout(() => successMsg.remove(), 500);
    }, 3000);

  } catch (error) {
    resultElement.innerHTML = `<div class="error-title">❌ Lỗi</div><div class="error-detail">${error.message}</div>`;
  } finally {
    loadingIndicator.style.display = "none";
    decryptButton.disabled = false;
  }
}

async function payUSDT(amount) {
  if (!provider) throw new Error("Ví chưa kết nối!");
  const signer = provider.getSigner();
  const usdtAddress = '0x55d398326f99059fF775485246999027B3197955'; // USDT BEP20
  const abi = ['function transfer(address to, uint256 value) returns (bool)'];
  const usdt = new ethers.Contract(usdtAddress, abi, signer);
  const tx = await usdt.transfer('0xcE6320183252CD965a70D4a9B6F30D2877a2188E', ethers.utils.parseUnits(amount.toString(), 6));
  await tx.wait();
  console.log('Thanh toán thành công:', tx.hash);
}

// Giũ nguyên các hàm khác: validateUnlockTime, copyEncrypted, copyDecrypted, validatePriceInput, validateNote, validateCoin, validateTargetPrice, validateMinPrice, validateUnlock, addEventListeners
