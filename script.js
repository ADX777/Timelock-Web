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
