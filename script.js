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
      ? `💹 Giá hiện tại: ${parseFloat(data.price).toFixed(2)} USDT (Binance)`
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

async function getCoinGeckoTime() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/ping");
    return new Date();
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
  const noteInput = document.getElementById("noteInput");
  const note = noteInput.value;
  const coin = document.getElementById("coinInput").value.toUpperCase();
  const price = document.getElementById("targetPrice").value;
  const time = document.getElementById("unlockTime").value;

  const now = await getBinanceTime();
  if (!now || new Date(time) < now) {
    noteInput.style.backgroundColor = "#ffcccc";
    alert("❌ Thời gian không hợp lệ hoặc không lấy được giờ thực!");
    return;
  }
  noteInput.style.backgroundColor = "";

  if (!/^\d+(\.\d{1,8})?$/.test(price)) {
    alert("❌ Giá kỳ vọng không hợp lệ. Chỉ được nhập số và dấu chấm.");
    document.getElementById("targetPrice").style.backgroundColor = "#ffcccc";
    return;
  }

  const encoder = new TextEncoder();
  const iv1 = crypto.getRandomValues(new Uint8Array(16));
  const iv2 = crypto.getRandomValues(new Uint8Array(16));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key1 = crypto.getRandomValues(new Uint8Array(32));

  const aesKey1 = await crypto.subtle.importKey("raw", key1, { name: "AES-CBC" }, false, ["encrypt"]);
  const cipher1Buf = await crypto.subtle.encrypt({ name: "AES-CBC", iv: iv1 }, aesKey1, encoder.encode(note));

  const key2Raw = `${coin}|${price}|${time}|${btoa(String.fromCharCode(...salt))}`;
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
    time
  };

  payload.sig = await sha256(JSON.stringify(payload));
  document.getElementById("encryptedOutput").value = `ENC[${btoa(JSON.stringify(payload))}]`;
}

document.getElementById("targetPrice").addEventListener("input", function () {
  let value = this.value;
  value = value.replace(/[^0-9.]/g, '');
  if (value.startsWith('.')) value = value.slice(1);
  const parts = value.split('.');
  if (parts.length > 2) value = parts[0] + '.' + parts[1];
  this.value = value;

  const isValid = /^\d+(\.\d{0,8})?$/.test(value);
  this.style.backgroundColor = isValid || value === "" ? "" : "#ffcccc";
});
