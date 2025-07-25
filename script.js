let allCoins = [];

const alphaKey = '58M61D2ZINADHSE2';
const twelveKey = '7f6d53f6d70e4c0e803d8efd66fb32f3';

let hasNoteError = false;

async function loadCoinList() {
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
    } catch (innerE) {
    }
  }
}
loadCoinList();

async function suggestCoins() {
  const input = document.getElementById("coinInput").value.toUpperCase();
  const suggestions = document.getElementById("coinSuggestions");
  suggestions.innerHTML = "";
  if (!input) return;

  let matches = allCoins.filter(c => c.startsWith(input));

  let cryptoMatches = matches.filter(c => c.endsWith('USDT'));
  let forexMatches = matches.filter(c => c.includes('/'));

  let sortedForex = forexMatches.sort();

  let sortedCrypto = cryptoMatches;

  if (cryptoMatches.length > 0) {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1');
      const data = await res.json();
      const rankMap = new Map();
      data.forEach(coin => {
        const symbolUpper = (coin.symbol.toUpperCase() + 'USDT');
        rankMap.set(symbolUpper, coin.market_cap_rank);
      });
      sortedCrypto = cryptoMatches.sort((a, b) => {
        const rankA = rankMap.get(a) ?? Infinity;
        const rankB = rankMap.get(b) ?? Infinity;
        if (rankA === rankB) return a.localeCompare(b);
        return rankA - rankB;
      });
    } catch (e) {
      sortedCrypto = cryptoMatches.sort();
    }
  }

  const sortedMatches = [...sortedCrypto, ...sortedForex];
  const top10 = sortedMatches.slice(0, 10);

  top10.forEach(match => {
    const div = document.createElement("div");
    div.textContent = match;
    div.addEventListener('click', () => {
      console.log("Clicked on: " + match);
      document.getElementById("coinInput").value = match;
      suggestions.innerHTML = "";
      fetchPrice();
    });
    suggestions.appendChild(div);
  });
}

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res;
    } catch (e) {
      console.error(`Error fetching ${url}: ${e}`);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return null;
}

async function getPrice(coin) {
  coin = coin.trim().toUpperCase();
  if (coin.includes('/')) {
    const [from, to] = coin.split('/');
    let price = null;
    const alphaUrl = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${alphaKey}`;
    const alphaRes = await fetchWithRetry(alphaUrl);
    if (alphaRes) {
      try {
        const data = await alphaRes.json();
        price = data['Realtime Currency Exchange Rate']?.['5. Exchange Rate'];
        if (price) return parseFloat(price);
      } catch {}
    }
    const twelveUrl = `https://api.twelvedata.com/price?symbol=${coin}&apikey=${twelveKey}`;
    const twelveRes = await fetchWithRetry(twelveUrl);
    if (twelveRes) {
      try {
        const data = await twelveRes.json();
        price = data.price;
        if (price) return parseFloat(price);
      } catch {}
    }
    return 0;
  } else if (coin.endsWith("USDT")) {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${coin}`);
      const data = await res.json();
      return data.price ? parseFloat(data.price) : 0;
    } catch {
      return 0;
    }
  } else {
    return 0;
  }
}

async function fetchPrice() {
  const coin = document.getElementById("coinInput").value.trim().toUpperCase();

  if (coin.includes('/')) {
    const [from, to] = coin.split('/');

    const alphaUrl = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${alphaKey}`;
    const alphaRes = await fetchWithRetry(alphaUrl);
    if (alphaRes) {
      try {
        const data = await alphaRes.json();
        const price = data['Realtime Currency Exchange Rate']?.['5. Exchange Rate'];
        if (price) {
          document.getElementById("livePrice").textContent = `💹 Giá hiện tại: ${parseFloat(price).toFixed(5)} USD`;
          return;
        }
      } catch {}
    }

    const twelveUrl = `https://api.twelvedata.com/price?symbol=${coin}&apikey=${twelveKey}`;
    const twelveRes = await fetchWithRetry(twelveUrl);
    if (twelveRes) {
      try {
        const data = await twelveRes.json();
        price = data.price;
        if (price) {
          document.getElementById("livePrice").textContent = `💹 Giá hiện tại: ${parseFloat(price).toFixed(5)} USD`;
          return;
        }
      } catch {}
    }

    document.getElementById("livePrice").textContent = "⚠️ Lỗi kết nối với API.";
  } else if (coin.endsWith("USDT")) {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${coin}`);
      const data = await res.json();
      document.getElementById("livePrice").textContent = data.price
        ? `💹 Giá hiện tại: ${parseFloat(data.price) < 0.001 ? parseFloat(data.price).toFixed(8) : parseFloat(data.price).toFixed(3)} USDT`
        : "❌ Không lấy được giá từ Binance.";
    } catch {
      document.getElementById("livePrice").textContent = "⚠️ Lỗi kết nối với Binance.";
    }
  } else {
    document.getElementById("livePrice").textContent = "";
  }
}

async function getBinanceTime() {
  try {
    const res = await fetch("https://api.binance.com/api/v3/time");
    const data = await res.json();
    return new Date(data.serverTime);
  } catch {
    return null;
  }
}

async function sha256(msg) {
  const buffer = new TextEncoder().encode(msg);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Bytes(msg) {
  const buffer = new TextEncoder().encode(msg);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", buffer));
}

async function encrypt() {
  const note = document.getElementById("noteInput").value;
  const coin = document.getElementById("coinInput").value.toUpperCase();
  const priceInput = document.getElementById("targetPrice").value.trim();
  const minInput = document.getElementById("minPrice").value.trim();
  const unlockLocalString = document.getElementById("unlockTime").value.trim();

  const currentPrice = await getPrice(coin);

  let price = null;
  if (priceInput) {
    price = parseFloat(priceInput);
  }

  let minPrice = null;
  if (minInput) {
    minPrice = parseFloat(minInput);
  }

  let timeUTC = null;
  if (unlockLocalString) {
    const unlockDate = new Date(unlockLocalString);
    timeUTC = unlockDate.toISOString();
  }

  const lit = new LitNodeClient();
  await lit.connect();
  const conditions = [
    { // Time đạt
      contractAddress: '',
      standardContractType: 'timestamp',
      chain: 'bnb',
      method: 'time',
      parameters: [Math.floor(new Date(unlockLocalString).getTime() / 1000)],
      returnValueTest: { comparator: '>', value: 'current_time' }
    },
    { // Giá đạt (Chainlink oracle cho BTC/USD as example, adjust for coin)
      contractAddress: '0x0567F2323251f0Aab15c8dFb1967e4e8A7D42aEe', // Oracle BTC/USD trên BNB
      standardContractType: 'oracle',
      chain: 'bnb',
      method: 'latestRoundData',
      parameters: [coin],
      returnValueTest: { comparator: '>', value: priceInput || '0' }
    }
  ];
  const encrypted = await lit.encrypt({
    dataToEncrypt: note,
    accessControlConditions: conditions
  });
  document.getElementById("encryptedOutput").value = encrypted;
  document.getElementById("encryptedOutput").classList.add('frozen-effect');
}

async function decrypt() {
  const decryptButton = document.getElementById("decryptButton");
  const loadingIndicator = document.getElementById("loadingIndicator");
  const resultElement = document.getElementById("decryptedResult");

  decryptButton.disabled = true;
  loadingIndicator.style.display = "block";
  resultElement.innerHTML = "";

  try {
    const input = document.getElementById("decryptionInput").value.trim();
    if (!input.startsWith("ENC[") || !input.endsWith("]")) {
      resultElement.textContent = "❌ Mã không đúng định dạng.";
      return;
    }

    // Connect ví
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' }); // Kết nối
      const accounts = await web3.eth.getAccounts();
      if (!accounts.length) throw new Error("Không kết nối được ví!");

      // Connect Lit
      const lit = new LitNodeClient();
      await lit.connect();

      // Decrypt on-chain (trả gas từ ví)
      const decrypted = await lit.decrypt({
        encryptedData: input,
        accessControlConditions: [] // Lit tự lấy từ encrypted
      }, {
        chain: 'bnb',
        account: accounts[0] // Địa chỉ ví
      });
      resultElement.innerHTML = `<div class="note-label">Ghi chú:</div><div class="note-content">${decrypted}</div>`;
      resultElement.classList.add('success-border');
      const successMsg = document.createElement('div');
      successMsg.id = 'successMsg';
      successMsg.textContent = 'Giải mã thành công';
      resultElement.appendChild(successMsg);

      setTimeout(() => {
        successMsg.style.opacity = 0;
        setTimeout(() => {
          successMsg.remove();
        }, 500);
      }, 3000);
    } else {
      throw new Error("Vui lòng cài ví crypto (MetaMask hoặc Coin98)!");
    }
  } catch {
    resultElement.textContent = "❌ Giải mã thất bại.";
  } finally {
    loadingIndicator.style.display = "none";
    decryptButton.disabled = false;
  }
}

async function validateUnlockTime() {
  const unlockInput = document.getElementById("unlockTime");
  const now = await getBinanceTime();
  const unlockTime = new Date(unlockInput.value);
  const isValid = now && unlockTime > now;

  if (!isValid) {
    unlockInput.classList.add("error-border");
    return false;
  } else {
    unlockInput.classList.remove("error-border");
    return true;
  }
}

function copyEncrypted() {
  const text = document.getElementById("encryptedOutput").value;
  navigator.clipboard.writeText(text).then(() => {
    const successMsg = document.createElement('div');
    successMsg.className = 'copy-success';
    successMsg.textContent = '✅ Đã sao chép!';
    const outputBlock = document.querySelector('.output-block');
    if (outputBlock) {
      outputBlock.appendChild(successMsg);
    } else {
      document.body.appendChild(successMsg);
    }
    setTimeout(() => {
      successMsg.style.opacity = 0;
      setTimeout(() => {
        successMsg.remove();
      }, 500);
    }, 3000);
  });
}

function copyDecrypted() {
  const noteContent = document.querySelector('.note-content');
  if (noteContent) {
    navigator.clipboard.writeText(noteContent.innerText).then(() => {
      const successMsg = document.createElement('div');
      successMsg.className = 'copy-success';
      successMsg.textContent = '✅ Đã sao chép!';
      const decryptedResult = document.getElementById("decryptedResult");
      if (decryptedResult) {
        decryptedResult.appendChild(successMsg);
      } else {
        document.body.appendChild(successMsg);
      }
      setTimeout(() => {
        successMsg.style.opacity = 0;
        setTimeout(() => {
          successMsg.remove();
        }, 500);
      }, 3000);
    });
  }
}

function validatePriceInput(input) {
  let value = input.value;
  value = value.replace(/[^0-9.]/g, '');
  const parts = value.split('.');
  if (parts.length > 2) {
    value = parts[0] + '.' + parts[1];
  }
  if (value.startsWith('.')) {
    value = '';
  }
  input.value = value;
}

function validateNote() {
  const input = document.getElementById("noteInput");
  const value = input.value.trim();
  input.classList.remove("error-border", "success-border");
  if (value !== '' && hasNoteError) {
    input.classList.add("success-border");
  }
}

function validateCoin() {
  const input = document.getElementById("coinInput");
  const value = input.value.trim().toUpperCase();
  input.classList.remove("error-border", "success-border");
  if (value !== '' && allCoins.includes(value)) {
    input.classList.add("success-border");
  } else if (value !== '') {
    // Không add error ở đây, chỉ khi ấn
  }
}

async function validateTargetPrice() {
  const input = document.getElementById("targetPrice");
  const value = input.value.trim();
  const coin = document.getElementById("coinInput").value.trim().toUpperCase();
  input.classList.remove("error-border", "success-border");
  if (value === '' || !allCoins.includes(coin)) return;
  const currentPrice = await getPrice(coin);
  if (currentPrice === 0) return;
  const price = parseFloat(value);
  if (price > currentPrice) {
    input.classList.add("success-border");
    document.getElementById("minPrice").classList.remove("error-border");
  }
}

async function validateMinPrice() {
  const input = document.getElementById("minPrice");
  const value = input.value.trim();
  const coin = document.getElementById("coinInput").value.trim().toUpperCase();
  input.classList.remove("error-border", "success-border");
  if (value === '' || !allCoins.includes(coin)) return;
  const currentPrice = await getPrice(coin);
  if (currentPrice === 0) return;
  const minPrice = parseFloat(value);
  if (minPrice < currentPrice) {
    input.classList.add("success-border");
    document.getElementById("targetPrice").classList.remove("error-border");
  }
}

async function validateUnlock() {
  const input = document.getElementById("unlockTime");
  const value = input.value.trim();
  input.classList.remove("error-border", "success-border");
  if (value === '') return;
  const now = await getBinanceTime();
  const unlock = new Date(value);
  if (now && !isNaN(unlock.getTime()) && unlock > now) {
    input.classList.add("success-border");
  }
}

// Add event listeners
document.addEventListener("DOMContentLoaded", () => {
  const noteInput = document.getElementById("noteInput");
  noteInput.addEventListener("input", () => {
    noteInput.value = noteInput.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/? ]/g, '');
    validateNote();
  });
  noteInput.addEventListener("blur", validateNote);

  const coinInput = document.getElementById("coinInput");
  coinInput.addEventListener("input", validateCoin);
  coinInput.addEventListener("blur", validateCoin);

  const targetPrice = document.getElementById("targetPrice");
  targetPrice.addEventListener("input", validateTargetPrice);
  targetPrice.addEventListener("blur", validateTargetPrice);

  const minPrice = document.getElementById("minPrice");
  minPrice.addEventListener("input", validateMinPrice);
  minPrice.addEventListener("blur", validateMinPrice);

  const unlockTime = document.getElementById("unlockTime");
  unlockTime.addEventListener("input", validateUnlock);
  unlockTime.addEventListener("blur", validateUnlock);
});
