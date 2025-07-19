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

// Function to update current time placeholder
function updateCurrentTimePlaceholder() {
  const now = new Date();
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const unlockInput = document.getElementById("unlockTime");
  unlockInput.placeholder = `${hour}:${minute} ngày ${day} tháng ${month}, ${year}`;
}

// Update time placeholder every second
setInterval(updateCurrentTimePlaceholder, 1000);
updateCurrentTimePlaceholder(); // Initial call

function parseVietnameseDate(str) {
  const match = str.match(/(\d{1,2}:\d{2}) ngày (\d{1,2}) tháng (\d{1,2}), (\d{4})/);
  if (!match) return null;
  const [_, hhmm, day, month, year] = match;
  const [hour, minute] = hhmm.split(':').map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  if (isNaN(date.getTime())) return null;
  return date;
}

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
  const note = document.getElementById("noteInput").value.trim();
  const coin = document.getElementById("coinInput").value.trim().toUpperCase();
  const price = document.getElementById("targetPrice").value.trim();
  let time = document.getElementById("unlockTime").value.trim();

  if (!note) {
    alert("❌ Vui lòng điền ghi chú.");
    return;
  }

  if (!price && !time) {
    alert("❌ Vui lòng điền ít nhất giá kỳ vọng hoặc thời gian.");
    return;
  }

  let direction = '';
  let currentPrice = 0;
  if (price) {
    if (!/^\d+(\.\d+)?$/.test(price)) {
      alert("❌ Giá kỳ vọng không hợp lệ. Vui lòng chỉ nhập số hoặc số thập phân.");
      return;
    }
    if (!coin || !allCoins.includes(coin)) {
      alert("❌ Coin không hợp lệ. Vui lòng chọn từ danh sách gợi ý.");
      return;
    }
    // Fetch current price to determine direction
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${coin}`);
      const data = await res.json();
      currentPrice = parseFloat(data.price);
      direction = parseFloat(price) > currentPrice ? 'up' : 'down';
    } catch {
      alert("⚠️ Lỗi lấy giá hiện tại từ Binance.");
      return;
    }
  }

  let unlockDate = null;
  if (time) {
    unlockDate = parseVietnameseDate(time) || new Date(time);
    if (isNaN(unlockDate.getTime())) {
      alert("❌ Định dạng thời gian không hợp lệ. Vui lòng sử dụng định dạng như 'HH:mm ngày DD tháng MM, YYYY'.");
      return;
    }
    const now = await getBinanceTime();
    if (!now || unlockDate <= now) {
      document.getElementById("unlockTime").classList.add("note-invalid");
      alert("❌ Thời gian mở khóa phải lớn hơn thời gian hiện tại.");
      return;
    } else {
      document.getElementById("unlockTime").classList.remove("note-invalid");
    }
    time = unlockDate.toISOString(); // Lưu dưới dạng ISO để dễ xử lý sau
  } else {
    time = '';
  }

  const encoder = new TextEncoder();
  const iv1 = crypto.getRandomValues(new Uint8Array(16));
  const iv2 = crypto.getRandomValues(new Uint8Array(16));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key1 = crypto.getRandomValues(new Uint8Array(32));

  const aesKey1 = await crypto.subtle.importKey("raw", key1, { name: "AES-CBC" }, false, ["encrypt"]);
  const cipher1Buf = await crypto.subtle.encrypt({ name: "AES-CBC", iv: iv1 }, aesKey1, encoder.encode(note));

  const key2Raw = `${coin || ''}|${price || ''}|${time}|${direction}|${btoa(String.fromCharCode(...salt))}`;
  const key2Hash = await sha256Bytes(key2Raw);
  const aesKey2 = await crypto.subtle.importKey("raw", key2Hash, { name: "AES-CBC" }, false, ["encrypt"]);
  const cipher2Buf = await crypto.subtle.encrypt({ name: "AES-CBC", iv: iv2 }, aesKey2, key1);

  const payload = {
    cipher1: btoa(String.fromCharCode(...new Uint8Array(cipher1Buf))),
    cipher2: btoa(String.fromCharCode(...new Uint8Array(cipher2Buf))),
    iv1: btoa(String.fromCharCode(...iv1)),
    iv2: btoa(String.fromCharCode(...iv2)),
    salt: btoa(String.fromCharCode(...salt)),
    coin: coin || '',
    price: price || '',
    time,
    direction
  };

  payload.sig = await sha256(JSON.stringify(payload));
  const encryptedText = `ENC[${btoa(JSON.stringify(payload))}]`;
  document.getElementById("encryptedOutput").value = encryptedText;
}

async function decrypt() {
  document.getElementById("decryptedResult").innerHTML = "⌛ Đang giải mã...";
  const input = document.getElementById("decryptionInput").value.trim();
  if (!input.startsWith("ENC[") || !input.endsWith("]")) {
    document.getElementById("decryptedResult").textContent = "❌ Mã không đúng định dạng.";
    return;
  }

  try {
    const payload = JSON.parse(atob(input.slice(4, -1)));
    const { cipher1, cipher2, iv1, iv2, salt, coin, price, time, direction, sig } = payload;

    const verifySig = await sha256(JSON.stringify({ cipher1, cipher2, iv1, iv2, salt, coin, price, time, direction }));
    if (verifySig !== sig) {
      document.getElementById("decryptedResult").textContent = "❌ Mã đã bị chỉnh sửa.";
      return;
    }

    const priceVal = price ? parseFloat(price) : NaN;
    const unlockTs = time ? Date.parse(time) : NaN;

    const hasPrice = price !== '';
    const hasTime = time !== '';

    if (hasPrice && coin === '') {
      document.getElementById("decryptedResult").textContent = "❌ Coin không được để trống khi có giá kỳ vọng.";
      return;
    }

    const fetchCoin = coin || "BTCUSDT";
    const data = await getPricesAndTimes(fetchCoin);

    let priceOK = !hasPrice || checkPriceConditions(data, priceVal, coin || fetchCoin, direction);
    let timeOK = !hasTime || checkTimeConditions(data, unlockTs);

    if (!priceOK || !timeOK) {
      const coinPair = (coin || "BTC").replace("USDT", "/USDT");
      const formattedPrice = price ? parseFloat(price).toLocaleString() : '';
      const formattedDate = time ? new Date(unlockTs).toLocaleDateString("vi-VN") : '';

      const msg = `
        🔒 Chưa đủ điều kiện mở khóa.<br>
        ${hasPrice ? `💰 Giá ${coinPair} mục tiêu: ${formattedPrice}$<br>` : ''}
        ${hasTime ? `⏰ Thời gian mục tiêu: ${formattedDate}` : ''}
      `;
      document.getElementById("decryptedResult").innerHTML = msg;
      return;
    }

    const key2Raw = `${coin}|${price}|${time}|${direction}|${salt}`;
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
    document.getElementById("decryptedResult").innerHTML = `📝 Ghi chú: ${note}<br/>🔓 Đã mở khóa`;
  } catch {
    document.getElementById("decryptedResult").textContent = "❌ Giải mã thất bại.";
  }
}

async function showPaymentPopup() {
  const note = document.getElementById("noteInput").value.trim();
  const coin = document.getElementById("coinInput").value.trim().toUpperCase();
  const price = document.getElementById("targetPrice").value.trim();
  const timeStr = document.getElementById("unlockTime").value.trim();

  if (!note) {
    alert("❌ Vui lòng điền ghi chú.");
    return;
  }

  if (!price && !timeStr) {
    alert("❌ Vui lòng điền ít nhất giá kỳ vọng hoặc thời gian.");
    return;
  }

  if (price) {
    if (!/^\d+(\.\d+)?$/.test(price)) {
      alert("❌ Giá kỳ vọng không hợp lệ. Vui lòng chỉ nhập số hoặc số thập phân.");
      return;
    }
    if (!coin || !allCoins.includes(coin)) {
      alert("❌ Coin không hợp lệ. Vui lòng chọn từ danh sách gợi ý.");
      return;
    }
  }

  if (timeStr) {
    const validTime = await validateUnlockTime();
    if (!validTime) return;

    const unlock = parseVietnameseDate(timeStr) || new Date(timeStr);
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
  } else {
    encrypt();
  }
}

async function validateUnlockTime() {
  const unlockInput = document.getElementById("unlockTime");
  const timeStr = unlockInput.value.trim();
  if (!timeStr) return true; // Không bắt buộc nếu không điền

  const unlockTime = parseVietnameseDate(timeStr) || new Date(timeStr);
  if (isNaN(unlockTime.getTime())) {
    unlockInput.classList.add("note-invalid");
    alert("❌ Định dạng thời gian không hợp lệ. Vui lòng sử dụng định dạng như 'HH:mm ngày DD tháng MM, YYYY'.");
    return false;
  }

  const now = await getBinanceTime();
  const isValid = now && unlockTime > now;

  if (!isValid) {
    unlockInput.classList.add("note-invalid");
    alert("❌ Thời gian mở khóa phải lớn hơn thời gian hiện tại.");
    return false;
  } else {
    unlockInput.classList.remove("note-invalid");
    return true;
  }
}

function copyEncrypted() {
  const text = document.getElementById("encryptedOutput").value;
  navigator.clipboard.writeText(text).then(() => alert("✅ Đã sao chép mã hóa!"));
}

function copyDecrypted() {
  const text = document.getElementById("decryptedResult").innerText;
  navigator.clipboard.writeText(text).then(() => alert("✅ Đã sao chép ghi chú!"));
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

  const results = await Promise.all(sources.map(async src => {
    try {
      const res = await fetch(src.url);
      const price = await res.json().then(data => {
        if (src.name === 'Binance') return parseFloat(data.price);
        if (src.name === 'Coinbase') return parseFloat(data.data.amount);
        if (src.name === 'CoinGecko') return parseFloat(data[coin.replace('USDT', '').toLowerCase()].usdt);
        if (src.name === 'CryptoCompare') return parseFloat(data.USDT);
      });
      const timestamp = new Date(res.headers.get('Date')).getTime();
      return { source: src.name, price, timestamp };
    } catch {
      return { source: src.name, price: null, timestamp: null };
    }
  }));

  return results;
}

function checkPriceConditions(data, targetPrice, coin, direction) {
  const good = data.filter(d => d.price != null);
  if (good.length < 2) return false;

  const prices = good.map(d => d.price);
  let okCount;
  if (direction === 'up') {
    okCount = prices.filter(p => p >= targetPrice).length;
  } else {
    okCount = prices.filter(p => p <= targetPrice).length;
  }
  const spread = Math.max(...prices) - Math.min(...prices);
  const maxAllowed = coin === "BTCUSDT" ? 700 : 300;

  return okCount >= 2 && spread <= maxAllowed;
}

function checkTimeConditions(data, unlockTime) {
  const good = data.filter(d => d.timestamp != null);
  if (good.length < 2) return false;

  const timestamps = good.map(d => d.timestamp);
  const meets = timestamps.filter(t => t >= unlockTime).length;
  const spread = Math.max(...timestamps) - Math.min(...timestamps);

  return meets >= 2 && spread <= 30 * 60 * 1000;
}
