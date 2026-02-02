// ====== Config ======
const MINT = "bsDjPRbrKg1rtL4gVVTzkzo1JFh5zAhh7j3XJNzpump";
const PHANTOM_URL = `https://phantom.com/tokens/solana/${MINT}`;
const DEX_API = `https://api.dexscreener.com/latest/dex/tokens/${MINT}`;

// Paste official links here once the founder confirms them:
const OFFICIAL = {
  x: "https://x.com/",        // <-- replace
  telegram: "https://t.me/",  // <-- replace
  website: "https://",        // <-- replace
};

// Add your existing “project-associated” images here after uploading to /images in your repo.
// Tip: keep filenames simple: meme-1.jpg, meme-2.png, etc.
const MEMES = [
  { src: "images/meme-1.jpg", caption: "Hallmark propaganda detected. Deploy counter-memes." },
  { src: "images/meme-2.jpg", caption: "Roses are overpriced. SOL is forever (maybe)." },
  { src: "images/meme-3.jpg", caption: "Text your ex? No. Buy $FVDAY? Also not advice." },
  // Add more:
  // { src: "images/meme-4.png", caption: "Your caption here." },
];

const $ = (id) => document.getElementById(id);

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
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

// ====== Render Meme Wall ======
function renderMemes() {
  const grid = $("memeGrid");
  if (!grid) return;

  // If user didn't upload memes yet, show a friendly warning
  if (!MEMES.length) {
    grid.innerHTML = `<div class="smallNote">No memes added yet. Upload files to /images and list them in app.js.</div>`;
    return;
  }

  grid.innerHTML = MEMES.map(m => `
    <div class="memeCard">
      <img src="${m.src}" alt="FVDAY meme" onerror="this.style.display='none'">
      <div class="memeCap">${m.caption || ""}</div>
    </div>
  `).join("");
}

// ====== Live Stats ======
async function loadDexStats() {
  $("phantomLink").href = PHANTOM_URL;

  // Community links (safe placeholders until you replace them)
  if (OFFICIAL.x && OFFICIAL.x !== "https://x.com/") $("xLink").href = OFFICIAL.x;
  else $("xLink").href = "https://x.com/search?q=FVDAY%20solana";

  if (OFFICIAL.telegram && OFFICIAL.telegram !== "https://t.me/") $("tgLink").href = OFFICIAL.telegram;
  else $("tgLink").href = "https://t.me/";

  if (OFFICIAL.website && OFFICIAL.website !== "https://") $("webLink").href = OFFICIAL.website;
  else $("webLink").href = "#";

  try {
    const res = await fetch(DEX_API, { cache: "no-store" });
    if (!res.ok) throw new Error(`Dex API HTTP ${res.status}`);
    const data = await res.json();

    const pairs = data?.pairs || [];
    if (!pairs.length) throw new Error("No Dex pairs found (yet).");

    // pick most liquid pair
    pairs.sort((a, b) => (b?.liquidity?.usd || 0) - (a?.liquidity?.usd || 0));
    const p = pairs[0];

    const priceUsd = p?.priceUsd ? Number(p.priceUsd) : null;
    const fdv = p?.fdv ? Number(p.fdv) : null;
    const vol24 = p?.volume?.h24 ? Number(p.volume.h24) : null;
    const chg24 = p?.priceChange?.h24 ? Number(p.priceChange.h24) : null;

    $("price").textContent = priceUsd
      ? `$${priceUsd.toFixed(priceUsd < 0.01 ? 8 : 6)}`
      : "—";
    $("mcap").textContent = fmtMoney(fdv);
    $("vol24").textContent = fmtMoney(vol24);
    $("chg24").textContent = fmtPct(chg24);

    $("chg24").style.color = (chg24 !== null && chg24 >= 0) ? "var(--ok)" : "var(--hot)";

    const url = p?.url || null;
    $("dexLink").href = url || "#";

    $("statsNote").textContent =
      `DEX: ${p?.dexId || "—"} • Pair: ${p?.baseToken?.symbol || "FVDAY"}/${p?.quoteToken?.symbol || "?"} • Liquidity: ${fmtMoney(p?.liquidity?.usd)}`;

  } catch (err) {
    $("statsNote").textContent =
      "Live stats unavailable right now (common for brand-new tokens). Add a Dexscreener link when the pair is indexed.";
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

  if (diff <= 0) {
    document.body.classList.add("meme");
    $("takeoverNote").textContent = "It’s Feb 14. Flip the script. 💔😈";
  }
}

// ====== Savage Mode + Easter Egg ======
let logoClicks = 0;
function initSavageMode() {
  $("memeModeBtn").addEventListener("click", () => {
    document.body.classList.toggle("meme");
  });

  $("logoBtn").addEventListener("click", () => {
    logoClicks++;
    if (logoClicks >= 7) {
      document.body.classList.toggle("meme");
      logoClicks = 0;
      $("takeoverNote").textContent = document.body.classList.contains("meme")
        ? "Savage Mode forced. You asked for this. 🧨"
        : "Savage Mode off. Back to pretending we’re normal. 🖤";
    }
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
renderMemes();
loadDexStats();
initSavageMode();
initCopy();
tickCountdown();

setInterval(tickCountdown, 1000);
setInterval(loadDexStats, 60000);
