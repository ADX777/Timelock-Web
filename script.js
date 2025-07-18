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
  if (!/^\d+(\.\d{1,8})?$/.test(price)) {
    alert("❌ Giá kỳ vọng không hợp lệ. Chỉ được nhập số và dấu chấm (không bắt đầu bằng dấu chấm).");
    document.getElementById("targetPrice").style.backgroundColor = "#ffcccc";
    return;
  } else {
    document.getElementById("targetPrice").style.backgroundColor = "";
  }

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


async function decrypt() {
  const input = document.getElementById("decryptionInput").value.trim();
  if (!input.startsWith("ENC[") || !input.endsWith("]")) {
    document.getElementById("decryptedResult").textContent = "❌ Mã không đúng định dạng.";
    return;
  }

  try {
    const payload = JSON.parse(atob(input.slice(4, -1)));
    const { cipher1, cipher2, iv1, iv2, salt, coin, price, time, sig } = payload;

    const verifySig = await sha256(JSON.stringify({ cipher1, cipher2, iv1, iv2, salt, coin, price, time }));
    if (verifySig !== sig) {
      document.getElementById("decryptedResult").textContent = "❌ Mã đã bị chỉnh sửa.";
      return;
    }

    let priceOK = false, timeOK = false;
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${coin}`);
      const data = await res.json();
      priceOK = parseFloat(data.price) >= parseFloat(price);
    } catch {}

    const binanceTime = await getBinanceTime();
    const geckoTime = await getCoinGeckoTime();
    const delta = Math.abs(binanceTime - geckoTime);
    if (!binanceTime || !geckoTime || delta > 30 * 60 * 1000) {
      document.getElementById("decryptedResult").textContent = "❌ Không xác thực được thời gian từ API.";
      return;
    }

    timeOK = binanceTime >= new Date(time);
    if (!priceOK && !timeOK) {
      document.getElementById("decryptedResult").textContent = "🔒 Chưa đủ điều kiện mở khóa.";
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
    document.getElementById("decryptedResult").innerHTML = `📝 Ghi chú: ${note}<br/>🔓 Đã mở khóa`;
  } catch {
    document.getElementById("decryptedResult").textContent = "❌ Giải mã thất bại.";
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

// 👇 Giao diện trực quan
function updateVisualConditions() {
  const coin = document.getElementById("coinInput").value.toUpperCase();
  const price = parseFloat(document.getElementById("targetPrice").value);
  const time = new Date(document.getElementById("unlockTime").value);

  let html = "";

  if (coin && !isNaN(price)) {
    html += `<p>🎯 Giá kỳ vọng: <strong style="color:green">${price.toLocaleString()} USDT</strong></p>`;
  }

  if (!isNaN(time.getTime())) {
    const now = new Date();
    const diff = Math.max(0, time - now);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    html += `<p>⏳ Còn lại: <strong>${hours}h ${minutes}m ${seconds}s</strong></p>`;
  }

  document.getElementById("conditionsDisplay").innerHTML = html;
}
setInterval(updateVisualConditions, 1000);

// Gửi notify lên Telegram bot, có alert dễ test trên iPhone
function sendNotifyToBot(duration, amount, coin) {
  fetch("https://flask-production-cac4.up.railway.app/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ duration, amount, coin })
  })
  .then(res => res.json())
  .then(data => alert("✅ Đã gửi notify thành công!"))
  .catch(err => alert("❌ Gửi notify lỗi: " + err));
}

// Bắt sự kiện nút mã hóa với id btnEncrypt
document.getElementById("btnEncrypt").addEventListener("click", async () => {
  await encrypt();

  const duration = document.getElementById("unlockTime").value;
  const amount = document.getElementById("targetPrice").value + " USDT";
  const coin = document.getElementById("coinInput").value.toUpperCase();

  sendNotifyToBot(duration, amount, coin);
});



// ✅ Kiểm tra input targetPrice chỉ cho số và dấu chấm
document.getElementById("targetPrice").addEventListener("input", function () {
  let val = this.value;
  val = val.replace(/[^0-9.]/g, '');
  if (val.startsWith('.')) val = val.substring(1);
  const parts = val.split('.');
  if (parts.length > 2) val = parts[0] + '.' + parts[1];
  this.value = val;

  const isValid = /^\d+(\.\d{0,8})?$/.test(val);
  this.style.backgroundColor = isValid || val === "" ? "" : "#ffcccc";
});
