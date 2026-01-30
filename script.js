// ===========================================
// AM Network (v1) — Auto links + Featured
// Fetches from Google Apps Script Web App
// ===========================================

// 1) Web App URL here (must end with /exec)
const API_BASE = "https://script.google.com/macros/s/AKfycbyfSA8AeVKv-rxOQce4HyDTLI-JEyZVeSwydV9DMGflr-IfAGYJ1ugW0YE5x86FLwnO/exec";

const $ = (id) => document.getElementById(id);

(() => {
  // ---------- Year ----------
  const yr = $("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  // ---------- Background visuals (stars + subtle dust) ----------
  const bg = $("bg");
  const sparks = $("sparks");
  const bctx = bg?.getContext("2d", { alpha: true });
  const sctx = sparks?.getContext("2d", { alpha: true });

  function resize() {
    if (!bg || !sparks || !bctx || !sctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    bg.width = Math.floor(innerWidth * dpr);
    bg.height = Math.floor(innerHeight * dpr);
    bg.style.width = innerWidth + "px";
    bg.style.height = innerHeight + "px";
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    sparks.width = Math.floor(innerWidth * dpr);
    sparks.height = Math.floor(innerHeight * dpr);
    sparks.style.width = innerWidth + "px";
    sparks.style.height = innerHeight + "px";
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", resize, { passive: true });
  resize();

  const rand = (a, b) => a + Math.random() * (b - a);

  // Starfield: slow circular motion
  const STAR_COUNT = Math.floor(Math.max(140, Math.min(220, innerWidth * 0.16)));
  const stars = [];

  function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      const layer = Math.random() < 0.55 ? 1 : (Math.random() < 0.75 ? 2 : 3);
      stars.push({
        x: rand(0, innerWidth),
        y: rand(0, innerHeight),
        r: rand(0.6, layer === 3 ? 1.6 : 1.2),
        a: rand(0.22, 0.82),
        tw: rand(0.004, 0.015),
        phase: rand(0, Math.PI * 2),
        layer
      });
    }
  }
  initStars();

  let theta = 0;
  function drawStars(t) {
    if (!bctx) return;
    bctx.clearRect(0, 0, innerWidth, innerHeight);
    theta += 0.00018;

    const cx = innerWidth * 0.5;
    const cy = innerHeight * 0.42;

    for (const st of stars) {
      const depth = st.layer;
      const ox = st.x - cx;
      const oy = st.y - cy;

      const ang = theta * (depth === 1 ? 1.0 : depth === 2 ? 0.72 : 0.52);
      const cos = Math.cos(ang), sin = Math.sin(ang);

      const rx = ox * cos - oy * sin;
      const ry = ox * sin + oy * cos;

      const x = cx + rx;
      const y = cy + ry;

      const tw = st.a + Math.sin((t * st.tw) + st.phase) * 0.10;
      bctx.globalAlpha = Math.max(0.05, Math.min(0.9, tw));
      bctx.beginPath();
      bctx.arc(x, y, st.r, 0, Math.PI * 2);
      bctx.fillStyle = "rgba(234,246,255,1)";
      bctx.fill();
    }
    bctx.globalAlpha = 1;
  }

  // Ambient dust (subtle)
  const dust = [];
  function emitDust() {
    if (!sctx) return;
    if (dust.length > 90) return;
    if (Math.random() > 0.30) return;

    dust.push({
      x: rand(0, innerWidth),
      y: rand(0, innerHeight * 0.6),
      vx: rand(-0.08, 0.08),
      vy: rand(0.04, 0.14),
      life: rand(130, 220),
      a: rand(0.06, 0.18)
    });
  }

  function drawDust() {
    if (!sctx) return;

    sctx.fillStyle = "rgba(7,10,20,0.10)";
    sctx.fillRect(0, 0, innerWidth, innerHeight);

    for (let i = dust.length - 1; i >= 0; i--) {
      const p = dust[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;

      sctx.globalAlpha = Math.max(0, p.a);
      sctx.beginPath();
      sctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      sctx.fillStyle = "rgba(70,247,255,1)";
      sctx.fill();

      if (p.life <= 0 || p.y > innerHeight + 20) dust.splice(i, 1);
    }
    sctx.globalAlpha = 1;
  }

  function loop(t) {
    drawStars(t);
    emitDust();
    drawDust();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---------- API: fetch + render ----------
  const featuredBtn = $("featuredBtn");
  const linksList = $("linksList");

  function safeText(v) {
    return (v === null || v === undefined) ? "" : String(v);
  }

  function sortLinks(list) {
    return list.slice().sort((a, b) => {
      const oa = Number(a.Order || 9999);
      const ob = Number(b.Order || 9999);
      return oa - ob;
    });
  }

  function pickFeatured(list) {
    if (!list.length) return null;
    let best = list[0];
    for (const item of list) {
      const c1 = Number(item.Clicks || 0);
      const c2 = Number(best.Clicks || 0);
      if (c1 > c2) best = item;
      else if (c1 === c2) {
        const o1 = Number(item.Order || 9999);
        const o2 = Number(best.Order || 9999);
        if (o1 < o2) best = item;
      }
    }
    return best;
  }

  function iconLabel(item) {
    const t = safeText(item.Title).trim();
    if (!t) return "•";
    return t[0].toUpperCase();
  }

  function pingClick(id) {
    const clean = safeText(id).trim();
    if (!clean) return;
    if (!API_BASE || API_BASE.includes("PASTE_YOUR_WEBAPP_URL_HERE")) return;

    const url = `${API_BASE}?action=click&id=${encodeURIComponent(clean)}`;

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([], { type: "text/plain" }));
        return;
      }
    } catch (_) {}

    try {
      fetch(url, { method: "POST", mode: "no-cors" }).catch(() => {});
    } catch (_) {}
  }

  function makeButton(item, extraClass = "") {
    const a = document.createElement("a");
    a.className = "btn " + extraClass;

    const href = safeText(item.URL) || "#";
    a.href = href;
    a.rel = "noopener";
    a.target = (href.startsWith("http")) ? "_blank" : "_self";

    const ico = document.createElement("span");
    ico.className = "ico";
    ico.textContent = iconLabel(item);

    const txt = document.createElement("span");
    txt.className = "txt";
    txt.textContent = safeText(item.Title);

    a.appendChild(ico);
    a.appendChild(txt);

    a.addEventListener("click", () => pingClick(item.ID));
    return a;
  }

  async function loadLinks() {
    if (!linksList || !featuredBtn) return;

    if (!API_BASE || API_BASE.includes("PASTE_YOUR_WEBAPP_URL_HERE")) {
      linksList.innerHTML = `<div class="skeleton">API_BASE set nahi hai. script.js me Web App URL paste karo.</div>`;
      const t = featuredBtn.querySelector(".txt");
      if (t) t.textContent = "Set API URL in script.js";
      featuredBtn.href = "#";
      featuredBtn.target = "_self";
      return;
    }

    const url = `${API_BASE}?action=links&ts=${Date.now()}`;
    linksList.innerHTML = `<div class="skeleton">Loading links…</div>`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);

      const json = await res.json();
      const listRaw = Array.isArray(json.links) ? json.links : [];
      const list = sortLinks(listRaw);

      if (!list.length) {
        linksList.innerHTML = `<div class="skeleton">No active links found (Active=true required).</div>`;
        const t = featuredBtn.querySelector(".txt");
        if (t) t.textContent = "No Featured Link";
        featuredBtn.href = "#";
        featuredBtn.target = "_self";
        return;
      }

      const featured = pickFeatured(list);

      featuredBtn.href = safeText(featured.URL) || "#";
      featuredBtn.target = (featuredBtn.href.startsWith("http")) ? "_blank" : "_self";
      const ft = featuredBtn.querySelector(".txt");
      if (ft) ft.textContent = safeText(featured.Title) || "Featured";

      featuredBtn.onclick = null;
      featuredBtn.addEventListener("click", () => pingClick(featured.ID));

      linksList.innerHTML = "";
      for (const item of list) {
        linksList.appendChild(makeButton(item, ""));
      }

    } catch (err) {
      linksList.innerHTML = `<div class="skeleton">Error loading links. Check Web App access = Anyone. (And API_BASE correct)</div>`;
      const t = featuredBtn.querySelector(".txt");
      if (t) t.textContent = "API Error";
      featuredBtn.href = "#";
      featuredBtn.target = "_self";
    }
  }

  loadLinks();
})();