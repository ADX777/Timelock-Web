let allCoins = [];

const alphaKey = '58M61D2ZINADHSE2';
const twelveKey = '7f6d53f6d70e4c0e803d8efd66fb32f3';

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
    console.error("❌ Không lấy được danh sách coin từ Binance", e);
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

    // Primary: Alpha Vantage
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

    // Fallback: Twelve Data
    const twelveUrl = `https://api.twelvedata.com/price?symbol=${coin}&apikey=${twelveKey}`;
    const twelveRes = await fetchWithRetry(twelveUrl);
    if (twelveRes) {
      try {
        const data = await twelveRes.json();
        const price = data.price;
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

  const encoder = new TextEncoder();
  const iv1 = crypto.getRandomValues(new Uint8Array(16));
  const iv2 = crypto.getRandomValues(new Uint8Array(16));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key1 = crypto.getRandomValues(new Uint8Array(32));

  const aesKey1 = await crypto.subtle.importKey("raw", key1, { name: "AES-CBC" }, false, ["encrypt"]);
  const cipher1Buf = await crypto.subtle.encrypt({ name: "AES-CBC", iv: iv1 }, aesKey1, encoder.encode(note));

  const key2Raw = `${coin}|${priceInput}|${minInput}|${timeUTC || ''}|${btoa(String.fromCharCode(...salt))}`;
  const key2Hash = await sha256Bytes(key2Raw);
  const aesKey2 = await crypto.subtle.importKey("raw", key2Hash, { name: "AES-CBC" }, false, ["encrypt"]);
  const cipher2Buf = await crypto.subtle.encrypt({ name: "AES-CBC", iv: iv2 }, aesKey2, key1);

  const payload = {
    cipher1: btoa(String.fromCharCode(...new Uint8Array(cipher1Buf))),
    cipher2: btoa(String.fromCharCode(...new Uint8Array(cipher2Buf))),
    iv1: btoa(String.fromCharCode(...iv1)),
    iv2: btoa(String.fromCharCode(...iv2)),
    salt: btoa(String.fromCharCode(...salt)),
    coin
  };

  if (priceInput) payload.price = priceInput;
  if (minInput) payload.minPrice = minInput;
  if (timeUTC) payload.time = timeUTC;

  payload.sig = await sha256(JSON.stringify(payload));
  const encryptedText = `ENC[${btoa(JSON.stringify(payload))}]`;
  document.getElementById("encryptedOutput").value = encryptedText;
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

    const payload = JSON.parse(atob(input.slice(4, -1)));
    const { cipher1, cipher2, iv1, iv2, salt, coin, price, minPrice, time, sig } = payload;

    let tempPayload = { cipher1, cipher2, iv1, iv2, salt, coin };
    if (price) tempPayload.price = price;
    if (minPrice) tempPayload.minPrice = minPrice;
    if (time) tempPayload.time = time;
    const verifySig = await sha256(JSON.stringify(tempPayload));
    if (verifySig !== sig) {
      resultElement.textContent = "❌ Mã đã bị chỉnh sửa.";
      return;
    }

    const priceVal = price ? parseFloat(price) : null;
    const minPriceVal = minPrice ? parseFloat(minPrice) : null;
    const unlockTs = time ? new Date(time).getTime() : null;
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const data = await getPricesAndTimes(coin);

    const priceOK = checkPriceConditions(data, priceVal, minPriceVal, coin);

    let timeResult = null;
    if (unlockTs !== null) {
      timeResult = await checkTimeConditions(unlockTs);
    } else {
      timeResult = { ok: false, allFailed: false };
    }

    if (timeResult.allFailed && unlockTs !== null) {
      resultElement.innerHTML = "⚠️ Không kết nối server thời gian, thử lại sau.";
      return;
    }

    const timeOK = unlockTs !== null ? timeResult.ok : false;

    if (!priceOK && !timeOK) {
      const coinPair = coin.replace("USDT", "/USDT");

      let msgContent = '';

      if (priceVal !== null) {
        const formattedPrice = parseFloat(price).toLocaleString("vi-VN");
        msgContent += `<div class="error-detail"><span class="icon">💰</span> ${coinPair} < ${formattedPrice}$</div>`;
      }

      if (minPriceVal !== null) {
        const formattedMin = parseFloat(minPrice).toLocaleString("vi-VN");
        msgContent += `<div class="error-detail"><span class="icon">💰</span> ${coinPair} > ${formattedMin}$</div>`;
      }

      if (unlockTs !== null) {
        const formattedDate = new Date(time).toLocaleString("vi-VN", { timeZone: userTimeZone, hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
        msgContent += `<div class="error-detail"><span class="icon">⏰</span> Thời gian < ${formattedDate}</div>`;
      }

      const msg = `
        <div class="error-title blink">Giải mã không thành công</div>
        ${msgContent}
      `;
      resultElement.innerHTML = msg;
      resultElement.classList.add('error-border');
      return;
    }

    const key2Raw = `${coin}|${price || ''}|${minPrice || ''}|${time || ''}|${salt}`;
    const key2Hash = await sha256Bytes(key2Raw);
    const aesKey2 = await crypto.subtle.importKey("raw", key2Hash, { name: "AES-CBC" }, false, ["decrypt"]);
    const key1Buf = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: Uint8Array.from(atob(iv2), c => c.charCodeAt(0)) },
      aesKey2,
      Uint8Array.from(atob(cipher2), c => c.charCodeAt(0))
    );

    const aesKey1 = await crypto.subtle.importKey("raw", key1Buf, { name: "AES-CBC" }, false, ["decrypt"]);
    const noteBuf = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: Uint8Array.from(atob(iv1), c => c.charCodeAt(0)) },
      aesKey1,
      Uint8Array.from(atob(cipher1), c => c.charCodeAt(0))
    );

    const note = new TextDecoder().decode(noteBuf);
    resultElement.innerHTML = `<div class="note-label">Ghi chú:</div><div class="note-content">${note}</div>`;
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
  } else {
    alert("❌ Không có nội dung để sao chép.");
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

async function getPricesAndTimes(coin) {
  if (coin.includes('/')) {
    const [from, to] = coin.split('/');

    const sources = [
      {
        name: 'Alpha Vantage',
        url: `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${alphaKey}`,
        parsePrice: (data) => data['Realtime Currency Exchange Rate']?.['5. Exchange Rate']
      },
      {
        name: 'Twelve Data',
        url: `https://api.twelvedata.com/price?symbol=${coin}&apikey=${twelveKey}`,
        parsePrice: (data) => data.price
      }
    ];

    const results = await Promise.all(sources.map(async src => {
      const res = await fetchWithRetry(src.url);
      if (!res) return { source: src.name, price: null, timestamp: null };
      try {
        const jsonData = await res.json();
        const price = parseFloat(src.parsePrice(jsonData));
        const timestamp = new Date(res.headers.get('Date')).getTime();
        if (!isNaN(price)) {
          return { source: src.name, price, timestamp };
        } else {
          return { source: src.name, price: null, timestamp: null };
        }
      } catch {
        return { source: src.name, price: null, timestamp: null };
      }
    }));
    return results;
  } else {
    const sources = [
      { name: 'Binance', url: `https://api.binance.com/api/v3/ticker/price?symbol=${coin}` },
      { name: 'Coinbase', url: `https://api.coinbase.com/v2/prices/${coin.replace('USDT', '')}-USDT/spot` },
      { name: 'CoinGecko', url: `https://api.coingecko.com/api/v3/simple/price?ids=${coin.replace('USDT', '').toLowerCase()}&vs_currencies=usdt` },
      { name: 'CryptoCompare', url: `https://min-api.cryptocompare.com/data/price?fsym=${coin.replace('USDT', '')}&tsyms=USDT` }
    ];

    // Fetch Binance first
    const binanceSrc = sources[0];
    try {
      const res = await fetch(binanceSrc.url);
      const dataJson = await res.json();
      const price = parseFloat(dataJson.price);
      const timestamp = new Date(res.headers.get('Date')).getTime();
      if (!isNaN(price) && price !== null) {
        return [{ source: 'Binance', price, timestamp }];
      } else {
        throw new Error('Invalid price from Binance');
      }
    } catch {
      // If Binance fails, fetch others in parallel
      const otherSources = sources.slice(1);
      const results = await Promise.all(otherSources.map(async src => {
        try {
          const res = await fetch(src.url);
          let price;
          const jsonData = await res.json();
          if (src.name === 'Coinbase') {
            price = parseFloat(jsonData.data.amount);
          } else if (src.name === 'CoinGecko') {
            price = parseFloat(jsonData[coin.replace('USDT', '').toLowerCase()].usdt);
          } else if (src.name === 'CryptoCompare') {
            price = parseFloat(jsonData.USDT);
          }
          const timestamp = new Date(res.headers.get('Date')).getTime();
          return { source: src.name, price, timestamp };
        } catch {
          return { source: src.name, price: null, timestamp: null };
        }
      }));
      return results;
    }
  }
}

function checkPriceConditions(data, targetPrice, minPrice, coin) {
  const good = data.filter(d => d.price != null && !isNaN(d.price));
  if (good.length < 1) return false;

  let highOK = targetPrice !== null ? good.some(d => d.price >= targetPrice) : false;
  let lowOK = minPrice !== null ? good.some(d => d.price <= minPrice) : false;

  return highOK || lowOK;
}

async function getTrustedTimes() {
  const sources = [
    {
      name: 'WorldTimeAPI',
      url: 'http://worldtimeapi.org/api/timezone/Etc/UTC',
      parse: async (res) => {
        const data = await res.json();
        return new Date(data.utc_datetime).getTime();
      }
    },
    {
      name: 'NIST',
      url: 'https://www.nist.gov/',
      parse: (res) => new Date(res.headers.get('Date')).getTime(),
      method: 'HEAD'
    },
    {
      name: 'Binance',
      url: 'https://api.binance.com/api/v3/time',
      parse: async (res) => {
        const data = await res.json();
        return data.serverTime;
      }
    }
  ];

  async function fetchWithRetry(src, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(src.url, { method: src.method || 'GET' });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res;
      } catch (e) {
        console.error(`Error fetching ${src.name}: ${e}`);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    return null;
  }

  const results = await Promise.all(sources.map(async (src) => {
    const res = await fetchWithRetry(src);
    if (!res) return null;
    try {
      const timestamp = await src.parse(res);
      if (isNaN(timestamp)) return null;
      return { source: src.name, timestamp };
    } catch {
      return null;
    }
  }));

  const validTimes = results.filter(t => t !== null);
  return validTimes.length > 0 ? validTimes : null;
}

async function getTrustedTimes() {
  const sources = [
    {
      name: 'WorldTimeAPI',
      url: 'http://worldtimeapi.org/api/timezone/Etc/UTC',
      parse: async (res) => {
        const data = await res.json();
        return new Date(data.utc_datetime).getTime();
      }
    },
    {
      name: 'NIST',
      url: 'https://www.nist.gov/',
      parse: (res) => new Date(res.headers.get('Date')).getTime(),
      method: 'HEAD'
    },
    {
      name: 'Binance',
      url: 'https://api.binance.com/api/v3/time',
      parse: async (res) => {
        const data = await res.json();
        return data.serverTime;
      }
    }
  ];

  async function fetchWithRetry(src, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(src.url, { method: src.method || 'GET' });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res;
      } catch (e) {
        console.error(`Error fetching ${src.name}: ${e}`);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    return null;
  }

  const results = await Promise.all(sources.map(async (src) => {
    const res = await fetchWithRetry(src);
    if (!res) return null;
    try {
      const timestamp = await src.parse(res);
      if (isNaN(timestamp)) return null;
      return { source: src.name, timestamp };
    } catch {
      return null;
    }
  }));

  const validTimes = results.filter(t => t !== null);
  return validTimes.length > 0 ? validTimes : null;
}

async function checkTimeConditions(unlockTs) {
  const times = await getTrustedTimes();
  if (times === null) {
    return { ok: false, fallback: true, allFailed: true };
  } else if (times.length === 1) {
    const ok = times[0].timestamp >= unlockTs;
    return { ok, fallback: true, allFailed: false };
  } else {
    const meeting = times.filter(t => t.timestamp >= unlockTs).length;
    const ok = meeting >= 2;
    return { ok, fallback: false, allFailed: false };
  }
}

async function showPaymentPopup() {
  const note = document.getElementById("noteInput").value.trim();
  const coin = document.getElementById("coinInput").value.trim().toUpperCase();
  const priceInput = document.getElementById("targetPrice").value.trim();
  const minInput = document.getElementById("minPrice").value.trim();
  const unlockLocalString = document.getElementById("unlockTime").value.trim();

  if (note === '') {
    document.getElementById("noteInput").classList.add("error-border");
    alert("❌ Không có gì để mã hóa.");
    return;
  }

  if (unlockLocalString === '') {
    document.getElementById("unlockTime").classList.add("error-border");
    alert("❌ Phải điền thời gian mở khóa.");
    return;
  }

  if (coin !== '') {
    if (priceInput === '') {
      document.getElementById("targetPrice").classList.add("error-border");
      alert("❌ Phải điền giá cao hơn khi có cặp tiền.");
      return;
    }
  }

  const currentPrice = await getPrice(coin);
  if (currentPrice === 0 && (priceInput || minInput)) {
    alert("❌ Không lấy được giá hiện tại.");
    return;
  }

  if (priceInput) {
    if (!/^\d+(\.\d+)?$/.test(priceInput)) {
      document.getElementById("targetPrice").classList.add("error-border");
      alert("❌ Giá kỳ vọng không hợp lệ. Vui lòng chỉ nhập số hoặc số thập phân.");
      return;
    }
    const price = parseFloat(priceInput);
    if (price <= currentPrice) {
      document.getElementById("targetPrice").classList.add("error-border");
      alert("❌ Giá cao hơn phải lớn hơn giá hiện tại.");
      return;
    }
  }

  if (minInput) {
    if (!/^\d+(\.\d+)?$/.test(minInput)) {
      document.getElementById("minPrice").classList.add("error-border");
      alert("❌ Giá thấp hơn không hợp lệ. Vui lòng chỉ nhập số hoặc số thập phân.");
      return;
    }
    const minPrice = parseFloat(minInput);
    if (minPrice >= currentPrice) {
      document.getElementById("minPrice").classList.add("error-border");
      alert("❌ Giá thấp hơn phải nhỏ hơn giá hiện tại.");
      return;
    }
  }

  const now = await getBinanceTime();
  const unlock = new Date(unlockLocalString);
  if (!now || isNaN(unlock.getTime()) || unlock <= now) {
    document.getElementById("unlockTime").classList.add("error-border");
    return;
  } else {
    document.getElementById("unlockTime").classList.remove("error-border");
  }

  const days = Math.ceil((unlock - new Date()) / (1000 * 60 * 60 * 24));
  const amount = (Math.max(days, 1) * 0.5).toFixed(2);
  document.getElementById("paymentAmount").textContent = `${amount} USDT`;

  document.getElementById("paymentOverlay").style.display = "flex";

  setTimeout(() => {
    document.getElementById("paymentOverlay").style.display = "none";
    encrypt();
  }, 8000);
}
