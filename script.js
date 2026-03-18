// ===========================================
// AM-369-Network — script.js
// PREMIUM WOOD EDITION
// API fetch + render, no canvas effects
// ===========================================

const API_BASE = "https://script.google.com/macros/s/AKfycbyfSA8AeVKv-rxOQce4HyDTLI-JEyZVeSwydV9DMGflr-IfAGYJ1ugW0YE5x86FLwnO/exec";

const $ = id => document.getElementById(id);

(() => {
  // Year
  const yr = $("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  // API helpers
  function safeText(v) {
    return (v === null || v === undefined) ? "" : String(v);
  }

  function sortLinks(list) {
    return list.slice().sort((a, b) => {
      return Number(a.Order || 9999) - Number(b.Order || 9999);
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
        if (Number(item.Order || 9999) < Number(best.Order || 9999)) best = item;
      }
    }
    return best;
  }

  function iconLabel(item) {
    const t = safeText(item.Title).trim();
    return t ? t[0].toUpperCase() : "•";
  }

  function pingClick(id) {
    const clean = safeText(id).trim();
    if (!clean || !API_BASE || API_BASE.includes("PASTE_YOUR_WEBAPP_URL_HERE")) return;
    const url = `${API_BASE}?action=click&id=${encodeURIComponent(clean)}`;
    try {
      if (navigator.sendBeacon) { navigator.sendBeacon(url, new Blob([], { type: "text/plain" })); return; }
    } catch (_) {}
    try { fetch(url, { method: "POST", mode: "no-cors" }).catch(() => {}); } catch (_) {}
  }

  function makeButton(item, isFeatured = false) {
    const a = document.createElement("a");
    a.className = "link-btn" + (isFeatured ? " featured-btn" : "");
    const href = safeText(item.URL) || "#";
    a.href = href;
    a.rel = "noopener";
    a.target = href.startsWith("http") ? "_blank" : "_self";

    const ico = document.createElement("span");
    ico.className = "link-ico";
    ico.textContent = isFeatured ? "★" : iconLabel(item);

    const txt = document.createElement("span");
    txt.className = "link-txt";
    txt.textContent = safeText(item.Title);

    a.appendChild(ico);
    a.appendChild(txt);
    a.addEventListener("click", () => pingClick(item.ID));
    return a;
  }

  async function loadLinks() {
    const featuredBtn = $("featuredBtn");
    const linksList   = $("linksList");
    if (!linksList || !featuredBtn) return;

    if (!API_BASE || API_BASE.includes("PASTE_YOUR_WEBAPP_URL_HERE")) {
      linksList.innerHTML = `<div class="skeleton">Set API_BASE in script.js</div>`;
      const t = featuredBtn.querySelector(".link-txt");
      if (t) t.textContent = "Set API URL";
      featuredBtn.href = "#";
      return;
    }

    const url = `${API_BASE}?action=links&ts=${Date.now()}`;
    linksList.innerHTML = `<div class="skeleton">Loading…</div>`;

    try {
      const res  = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      const list = sortLinks(Array.isArray(json.links) ? json.links : []);

      if (!list.length) {
        linksList.innerHTML = `<div class="skeleton">No active links found.</div>`;
        const t = featuredBtn.querySelector(".link-txt");
        if (t) t.textContent = "No Featured Link";
        featuredBtn.href = "#";
        return;
      }

      // Featured
      const featured = pickFeatured(list);
      featuredBtn.href   = safeText(featured.URL) || "#";
      featuredBtn.target = featuredBtn.href.startsWith("http") ? "_blank" : "_self";
      const ft = featuredBtn.querySelector(".link-txt");
      if (ft) ft.textContent = safeText(featured.Title) || "Featured";
      featuredBtn.onclick = null;
      featuredBtn.addEventListener("click", () => pingClick(featured.ID));

      // All links
      linksList.innerHTML = "";
      for (const item of list) {
        linksList.appendChild(makeButton(item, false));
      }

    } catch (err) {
      linksList.innerHTML = `<div class="skeleton">Error loading. Check API access.</div>`;
      const t = featuredBtn.querySelector(".link-txt");
      if (t) t.textContent = "API Error";
      featuredBtn.href = "#";
    }
  }

  loadLinks();
})();
