let allCoins = [];

async function loadCoinList() {
  try {
    const res = await fetch("https://api.binance.com/api/v3/exchangeInfo");
    const data = await res.json();
    allCoins = data.symbols
      .filter(s => s.symbol.endsWith("USDT"))
      .map(s => s.symbol);
  } catch (e) {
    console.error("❌ Không lấy được danh sách coin từ Binance", e);
  }
}
loadCoinList();

function suggestCoins() {
  const input = document.getElementById("coinInput").value.toUpperCase();
  const suggestions = document.getElementById("coinSuggestions");
  suggestions.innerHTML = "";
  if (!input) return;

  const matches = allCoins.filter(c => c.startsWith(input)).slice(0, 10);
  matches.forEach(match => {
    const div = document.createElement("div");
    div.textContent = match;
    div.onclick = () => {
      document.getElementById("coinInput").value = match;
      suggestions.innerHTML = "";
      fetchPrice();
    };
    suggestions.appendChild(div);
  });
}

async function fetchPrice() {
  const coin = document.getElementById("coinInput").value.trim().toUpperCase();
  if (!coin.endsWith("USDT")) {
    document.getElementById("livePrice").textContent = "";
    return;
  }

  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${coin}`);
    const data = await res.json();
    document.getElementById("livePrice").textContent = data.price
      ? `💹 Giá hiện tại: ${parseFloat(data.price).toFixed(2)} USDT`
      : "❌ Không lấy được giá từ Binance.";
  } catch {
    document.getElementById("livePrice").textContent = "⚠️ Lỗi kết nối với Binance.";
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
  const price = document.getElementById("targetPrice").value;
  const unlockLocalString = document.getElementById("unlockTime").value;

  if (!/^\d+(\.\d+)?$/.test(price)) {
    alert("❌ Giá kỳ vọng không hợp lệ. Vui lòng chỉ nhập số hoặc số thập phân.");
    return;
  }

  const now = await getBinanceTime();
  const unlockDate = new Date(unlockLocalString);
  const timeUTC = unlockDate.toISOString();

  const unlockInput = document.getElementById("unlockTime");
  if (!now || isNaN(unlockDate.getTime()) || unlockDate <= now) {
    unlockInput.classList.add("note-invalid");
    return;
  } else {
    unlockInput.classList.remove("note-invalid");
  }

  const encoder = new TextEncoder();
  const iv1 = crypto.getRandomValues(new Uint8Array(16));
  const iv2 = crypto.getRandomValues(new Uint8Array(16));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key1 = crypto.getRandomValues(new Uint8Array(32));

  const aesKey1 = await crypto.subtle.importKey("raw", key1, { name: "AES-CBC" }, false, ["encrypt"]);
  const cipher1Buf = await crypto.subtle.encrypt({ name: "AES-CBC", iv: iv1 }, aesKey1, encoder.encode(note));

  const key2Raw = `${coin}|${price}|${timeUTC}|${btoa(String.fromCharCode(...salt))}`;
  const key2Hash = await sha256Bytes(key2Raw);
  const aesKey2 = await crypto.subtle.importKey("raw", key2Hash, { name: "AES-CBC" }, false, ["encrypt"]);
  const cipher2Buf = await crypto.subtle.encrypt({ name: "AES-CBC", iv: iv2 }, aesKey2, key1);

  const payload = {
    cipher1: btoa(String.fromCharCode(...new Uint8Array(cipher1Buf))),
    cipher2: btoa(String.fromCharCode(...new Uint8Array(cipher2Buf))),
    iv1: btoa(String.fromCharCode(...iv1)),
    iv2: btoa(String.fromCharCode(...iv2)),
    salt: btoa(String.fromCharCode(...salt)),
    coin,
    price,
    time: timeUTC
  };

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
    const { cipher1, cipher2, iv1, iv2, salt, coin, price, time, sig } = payload;

    const verifySig = await sha256(JSON.stringify({ cipher1, cipher2, iv1, iv2, salt, coin, price, time }));
    if (verifySig !== sig) {
      resultElement.textContent = "❌ Mã đã bị chỉnh sửa.";
      return;
    }

    const priceVal = parseFloat(price);
    const unlockTs = new Date(time).getTime();
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const data = await getPricesAndTimes(coin);

    const priceOK = checkPriceConditions(data, priceVal, coin);
    const timeResult = await checkTimeConditions(unlockTs);

    if (timeResult.allFailed) {
      resultElement.innerHTML = "⚠️ Không kết nối server thời gian, thử lại sau.";
      return;
    }

    const timeOK = timeResult.ok;

    if (!priceOK && !timeOK) {
      const coinPair = coin.replace("USDT", "/USDT");
      const formattedPrice = parseFloat(price).toLocaleString("vi-VN");
      const formattedDate = new Date(time).toLocaleString("vi-VN", { timeZone: userTimeZone, hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

      const msg = `
        <div class="error-title blink">Giải mã không thành công</div>
        <div class="error-detail"><span class="icon">💰</span> ${coinPair} < ${formattedPrice}$</div>
        <div class="error-detail"><span class="icon">⏰</span> Thời gian < ${formattedDate}</div>
      `;
      resultElement.innerHTML = msg;
      resultElement.classList.add('error-border');
      return;
    }

    const key2Raw = `${coin}|${price}|${time}|${salt}`;
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
    resultElement.classList.add('success-border'); // Sửa ở đây: Chuyển từ error-border sang success-border khi thành công
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

function showPaymentPopup() {
  validateUnlockTime().then(valid => {
    if (!valid) return;
    const unlock = new Date(document.getElementById("unlockTime").value);
    const now = new Date();
    let days = Math.ceil((unlock - now) / (1000 * 60 * 60 * 24));
    if (isNaN(days) || days < 1) days = 1;
    const amount = (days * 0.5).toFixed(2);
    document.getElementById("paymentAmount").textContent = `${amount} USDT`;

    document.getElementById("paymentOverlay").style.display = "flex";
    setTimeout(() => {
      document.getElementById("paymentOverlay").style.display = "none";
      encrypt();
    }, 8000);
  });
}

async function validateUnlockTime() {
  const unlockInput = document.getElementById("unlockTime");
  const now = await getBinanceTime();
  const unlockTime = new Date(unlockInput.value);
  const isValid = now && unlockTime > now;

  if (!isValid) {
    unlockInput.classList.add("note-invalid");
    return false;
  } else {
    unlockInput.classList.remove("note-invalid");
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
      const decryptedResult = document.getElementById('decryptedResult');
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

// ✅ Các hàm hỗ trợ logic kiểm tra giá & thời gian
async function getPricesAndTimes(coin) {
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

function checkPriceConditions(data, targetPrice, coin) {
  const good = data.filter(d => d.price != null && !isNaN(d.price));
  if (good.length < 1) return false;
  return good.some(d => d.price >= targetPrice);
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
