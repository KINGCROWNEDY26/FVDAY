// ====== Config ======
const MINT = "bsDjPRbrKg1rtL4gVVTzkzo1JFh5zAhh7j3XJNzpump"; // from your screenshot
const PHANTOM_URL = `https://phantom.com/tokens/solana/${MINT}`;

// Dexscreener token endpoint (Solana tokens supported)
const DEX_API = `https://api.dexscreener.com/latest/dex/tokens/${MINT}`;

// ====== Helpers ======
const $ = (id) => document.getElementById(id);

function fmtUSD(num) {
  if (num === null || num === undefined || Number.isNaN(Number(num))) return "—";
  const n = Number(num);
  if (n >= 1e9) return `$${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n/1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n/1e3).toFixed(2)}K`;
  return `$${n.toFixed(6)}`;
}

function fmtMoney(num) {
  if (num === null || num === undefined || Number.isNaN(Number(num))) return "—";
  const n = Number(num);
  if (n >= 1e9) return `$${(n/1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n/1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n/1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtPct(num) {
  if (num === null || num === undefined || Number.isNaN(Number(num))) return "—";
  const n = Number(num);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

// ====== Live Stats ======
async function loadDexStats() {
  $("phantomLink").href = PHANTOM_URL;

  try {
    const res = await fetch(DEX_API, { cache: "no-store" });
    if (!res.ok) throw new Error(`Dex API HTTP ${res.status}`);
    const data = await res.json();

    const pairs = data?.pairs || [];
    if (!pairs.length) throw new Error("No Dex pairs found (yet).");

    // Choose the most liquid pair
    pairs.sort((a, b) => (b?.liquidity?.usd || 0) - (a?.liquidity?.usd || 0));
    const p = pairs[0];

    const priceUsd = p?.priceUsd ? Number(p.priceUsd) : null;
    const mcap = p?.fdv ? Number(p.fdv) : null; // Dex uses FDV; for memecoins often treated as mcap proxy
    const vol24 = p?.volume?.h24 ? Number(p.volume.h24) : null;
    const chg24 = p?.priceChange?.h24 ? Number(p.priceChange.h24) : null;

    $("price").textContent = priceUsd ? `$${priceUsd.toFixed(priceUsd < 0.01 ? 8 : 6)}` : "—";
    $("mcap").textContent = fmtMoney(mcap);
    $("vol24").textContent = fmtMoney(vol24);
    $("chg24").textContent = fmtPct(chg24);

    // green/red hint (no custom colors demanded; using built-in variable)
    $("chg24").style.color = (chg24 !== null && chg24 >= 0) ? "var(--ok)" : "var(--hot)";

    const url = p?.url || null;
    $("dexLink").href = url || "#";

    $("statsNote").textContent =
      `Pair: ${p?.baseToken?.symbol || "FVDAY"}/${p?.quoteToken?.symbol || "?"} • DEX: ${p?.dexId || "—"} • Liquidity: ${fmtMoney(p?.liquidity?.usd)}`;

  } catch (err) {
    $("statsNote").textContent =
      "Live stats unavailable right now (common for very new tokens). The site still works — add Dexscreener link when ready.";
    $("dexLink").href = "#";
  }
}

// ====== Countdown to Feb 14 (local time) ======
function getNextValentines() {
  const now = new Date();
  const year = now.getFullYear();
  const vThis = new Date(year, 1, 14, 0, 0, 0); // Feb = 1
  if (now <= vThis) return vThis;
  return new Date(year + 1, 1, 14, 0, 0, 0);
}

function tickCountdown() {
  const target = getNextValentines();
  const now = new Date();
  const diff = target - now;

  const sec = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;

  $("d").textContent = String(days).padStart(2, "0");
  $("h").textContent = String(hours).padStart(2, "0");
  $("m").textContent = String(mins).padStart(2, "0");
  $("s").textContent = String(secs).padStart(2, "0");

  // Takeover when Feb 14 hits (diff <= 0)
  if (diff <= 0) {
    document.body.classList.add("meme");
    $("takeoverNote").textContent = "It’s Feb 14. Flip the script. 💔😈";
  }
}

// ====== Meme mode + Easter eggs ======
let logoClicks = 0;
function initEasterEggs() {
  const logo = document.querySelector(".logo");
  logo.addEventListener("click", () => {
    logoClicks++;
    if (logoClicks >= 7) {
      document.body.classList.toggle("meme");
      logoClicks = 0;
      const note = $("takeoverNote");
      note.textContent = document.body.classList.contains("meme")
        ? "Meme Mode unlocked. The internet is healing. 🧨"
        : "Meme Mode disabled. Back to business. 🖤";
    }
  });

  $("memeModeBtn").addEventListener("click", () => {
    document.body.classList.toggle("meme");
  });
}

// ====== Copy mint buttons ======
function initCopy() {
  const mintText = $("mintText").textContent.trim();

  $("copyMintBtn").addEventListener("click", async () => {
    const ok = await copyText(mintText);
    $("copyMintBtn").textContent = ok ? "Copied" : "Copy failed";
    setTimeout(() => ($("copyMintBtn").textContent = "Copy"), 1200);
  });

  $("copyMintBtn2").addEventListener("click", async () => {
    const ok = await copyText(mintText);
    $("copyMintBtn2").textContent = ok ? "Copied Mint" : "Copy failed";
    setTimeout(() => ($("copyMintBtn2").textContent = "Copy Mint"), 1200);
  });
}

// ====== Boot ======
loadDexStats();
initEasterEggs();
initCopy();
tickCountdown();
setInterval(tickCountdown, 1000);

// refresh live stats every 60s
setInterval(loadDexStats, 60000);
