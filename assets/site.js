// dramreads — shared behaviour for every page.
// shortcut: header, footer and the sample catalogue are injected/stored here so five static pages stay in sync;
// move to a real template or CMS when the site is built for launch.

const BOOKS = [
  { id: "signed", lead: "f", title: "Signed, Sealed, His", genre: "Contract Marriage", cv: "linear-gradient(165deg,#D2564E,#8A1E2C 62%,#4E0F1A)", art: "m-ring",
    hook: "A one-year marriage contract. Clause 14 says no falling in love.", tags: ["Contract Marriage", "Billionaire", "Slow burn"], words: "412k", chapters: 238, status: "Complete", rights: ["Exclusive", "Buyout"],
    ch: "chapter 3", text: "Ava read the contract twice. Twelve months. Separate bedrooms. A public kiss at every charity gala, and not one in private. She signed the last page and slid it across the desk. Damien didn't look at the signature. He looked at her hand, at the ring that had belonged to his mother, and said quietly, \"There's a clause you skipped.\" She turned back to page nine. It hadn't been there an hour ago." },
  { id: "don", lead: "f", title: "The Don's Borrowed Bride", genre: "Mafia Romance", cv: "linear-gradient(165deg,#5B4A80,#251C3A 60%,#120D1E)", art: "m-veil",
    hook: "She took her sister's place at the altar. He noticed before the vows.", tags: ["Mafia", "Bride Swap", "Enemies to lovers"], words: "286k", chapters: 171, status: "Complete", rights: ["Exclusive"],
    ch: "chapter 1", text: "The veil was heavy enough to hide her face, and that was the whole plan. Walk down the aisle. Say Lena's name. Disappear before the reception. Matteo Russo lifted the veil a fraction of an inch, just enough to see her eyes, and smiled like a man who had been handed a better gift than the one he ordered. \"You're not Lena,\" he murmured. \"Keep walking.\"" },
  { id: "second", lead: "f", title: "Second Life, Same Enemy", genre: "Rebirth & Revenge", cv: "linear-gradient(165deg,#C98A45,#6E4220 60%,#2E1B0E)", art: "m-clock",
    hook: "She died at her stepsister's hand. She woke up the morning of the engagement.", tags: ["Rebirth", "Revenge", "Second chance"], words: "198k", chapters: 124, status: "Ongoing, 60 banked", rights: ["Exclusive", "Buyout"],
    ch: "chapter 2", text: "The calendar on the wall said June 4th. Three years before the fire. Claire pressed her palm flat against the glass of the window and counted her breaths until they stopped shaking. Downstairs, her stepsister was laughing at something their father said. The same laugh. The same dress. This time Claire went down the stairs first." },
  { id: "offside", lead: "f", title: "Off Side", genre: "Hockey Romance", cv: "linear-gradient(165deg,#4FA3B3,#145466 58%,#0A2A35)", art: "m-ice",
    hook: "The only woman on the team. The captain who voted against her.", tags: ["Sports Romance", "Female Athlete", "Rivals"], words: "164k", chapters: 98, status: "Complete", rights: ["Exclusive", "Buyout"],
    ch: "chapter 4", text: "The vote was eleven to one. Jess didn't need to ask who the one was. Kane Whitfield skated past her at practice without a word, without a glance, and then stopped dead at the boards when coach read out the new line pairings. Her name. His name. Same line. He finally looked at her, and it wasn't anger in his eyes." },
  { id: "ash", lead: "f", title: "Ash-Crowned", genre: "Dragon Fantasy", cv: "linear-gradient(165deg,#B4452A,#561712 58%,#220807)", art: "m-flame",
    hook: "The dragon king needs a bride who can survive his fire. Nine have not.", tags: ["Dragon", "Fated mates", "Fantasy"], words: "355k", chapters: 201, status: "Ongoing, 80 banked", rights: ["Exclusive"],
    ch: "chapter 1", text: "They lined the tenth bride up at the foot of the mountain with the tribute grain and the goats. Rhea did not cry, which the priests took as courage. It was arithmetic. Nine women had walked up that path in white. Not one had walked down. But none of the nine had known what Rhea knew about the king's fire." },
  { id: "clause", lead: "f", title: "The Mistletoe Clause", genre: "Christmas Romance", cv: "linear-gradient(165deg,#2F6B4E,#16382A 60%,#0B1E16)", art: "m-holly", soon: true,
    hook: "Fake fiancé for Christmas. Real ring by New Year.", tags: ["Christmas", "Fake Dating", "Short-form"], words: "48k", chapters: 30, status: "Releasing December", rights: ["Exclusive"],
    ch: "chapter 1", text: "Nora's mother had invited her ex to Christmas. So Nora invited a stranger from the coffee shop, paid him two hundred dollars, and told him his name was Daniel. He said his name actually was Daniel. Then her ex walked in, saw him, and went completely white." },
  { id: "spat", lead: "m", title: "The Son-in-Law They Spat On", genre: "Urban Son-in-Law", cv: "linear-gradient(165deg,#6F8197,#28323F 58%,#11161D)", art: "m-tower",
    hook: "Three years of humiliation. One phone call from the family he walked away from.", tags: ["Son-in-Law", "Hidden identity", "Status reversal"], words: "520k", chapters: 610, status: "Complete", rights: ["Exclusive", "Buyout"],
    ch: "chapter 1", text: "At the Chen family dinner, Lin Feng was handed the bill again. His mother-in-law laughed, and the rest of the table laughed with her. He paid it with the last of his wages. In the parking lot his phone rang, a number he had blocked three years ago. \"Young master,\" said the voice. \"The board voted. It's yours. All of it.\"" },
  { id: "peak", lead: "m", title: "Descent of the Ninth Peak", genre: "Mountain Descent", cv: "linear-gradient(165deg,#5C9C7C,#1F4A38 58%,#0D2219)", art: "m-peak",
    hook: "Thirty years on the mountain. His first day in Manhattan.", tags: ["Mountain Descent", "Cultivation", "Overpowered lead"], words: "478k", chapters: 532, status: "Ongoing, 120 banked", rights: ["Exclusive"],
    ch: "chapter 1", text: "His master's last instruction was simple: go down, find the girl you were betrothed to, and keep her alive. Kai stepped off the bus at Port Authority in robes, barefoot, and a man tried to rob him within four minutes. He let him. He wanted to see how fast a city man could run. Then he saw the photograph in his betrothal letter on a billboard." },
  { id: "winter", lead: "m", title: "Day One of the Last Winter", genre: "Apocalypse", cv: "linear-gradient(165deg,#8FAAC8,#2D4560 58%,#121D2A)", art: "m-snow",
    hook: "He has lived the end of the world once. This time he has 30 days of warning.", tags: ["Apocalypse", "Rebirth", "System"], words: "302k", chapters: 340, status: "Complete", rights: ["Exclusive", "Buyout"],
    ch: "chapter 1", text: "The frost came on November 2nd, the first time. Ethan opened his eyes on October 3rd with the taste of blood still in his mouth and a blue window hanging in the air in front of him. Thirty days. He emptied his savings before breakfast. By noon he had bought a warehouse. By midnight the people who had killed him were on his list." }
];
const QUOTES = [
  { id: "don", q: "“You're not Lena,” he murmured. “Keep walking.”" },
  { id: "signed", q: "She turned back to page nine. It hadn't been there an hour ago." },
  { id: "spat", q: "“The board voted. It's yours. All of it.”" },
  { id: "clause", q: "Then her ex walked in, saw him, and went completely white." },
  { id: "winter", q: "By midnight, the people who had killed him were on his list." }
];
const PAGES = [["home.html", "Home"], ["about.html", "About Us"], ["catalog.html", "Catalog"], ["partner.html", "How We Partner"]];
const MAIL = "partnerships@dramreads.com";

const $ = (s, el = document) => el.querySelector(s);
const byId = id => BOOKS.find(b => b.id === id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const page = document.body.dataset.page;

// ---------- Header + footer ----------
const navLinks = PAGES.map(([href, label]) => `<a href="${href}"${page === href.replace(".html", "") ? ' aria-current="page"' : ""}>${label}</a>`).join("");
document.body.insertAdjacentHTML("afterbegin", `
  <header class="hdr" id="hdr">
    <a class="logo" href="home.html" aria-label="dramreads home">dram<i>reads</i></a>
    <nav aria-label="Main">${navLinks}</nav>
    <a class="btn" href="contact.html">Partner With Us</a>
    <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="panel" aria-label="Open menu"><span></span></button>
  </header>
  <div class="panel" id="panel">${navLinks}<a href="contact.html"${page === "contact" ? ' aria-current="page"' : ""}>Partnership Inquiry</a><p class="mail">${MAIL}</p></div>`);

// Phone tab bar (shown under 900px by CSS)
// Centre slot is the raised "Request" action; the other four are sections.
const TABS = [
  ["home", "Home", '<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>'],
  ["catalog", "Catalog", '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v14.5H6.5A1.5 1.5 0 0 0 5 19z"/><path d="M5 19a1.5 1.5 0 0 0 1.5 1.5H19v-3"/>'],
  ["contact", "Request", '<path d="M19.5 4.5c-6.5 0-11 4-12 11l-2 4.5 4.5-2c7-1 11-5.5 9.5-13.5z"/><path d="M8 16l6.5-6.5"/>', "fab"],
  ["partner", "Partner", '<path d="M6.5 3h8l4 4v14h-12z"/><path d="M14.5 3v4h4"/><path d="M9.5 12.5h6M9.5 16h4"/>'],
  ["about", "About", '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.4"/>']
];
document.body.insertAdjacentHTML("beforeend", `<nav class="tabbar" aria-label="Sections">${TABS.map(([key, label, icon, kind]) =>
  `<a href="${key}.html"${kind ? ` class="${kind}"` : ""}${page === key ? ' aria-current="page"' : ""}><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg></span>${label}</a>`).join("")}</nav>`);
document.body.insertAdjacentHTML("beforeend", `
  <footer>
    ${page === "contact" ? "" : `<div class="wrap end"><span class="ch">end of chapter</span><h2>The next one is yours to sign.</h2>
      <div class="row"><a class="btn" href="contact.html">Partner With Us</a><span>${MAIL}</span></div></div>`}
    <div class="wrap">
      <div class="foot"><div><a class="logo" href="home.html">dram<i>reads</i></a><p>Stay for the drama.</p></div>
        <ul><li><a href="about.html">About Us</a></li><li><a href="catalog.html">Genres &amp; Catalog</a></li><li><a href="partner.html">How We Partner</a></li><li><a href="contact.html">Partnership Inquiry</a></li></ul></div>
      <div class="base"><span>Direct Partnerships: ${MAIL}</span><span>© 2026 dramreads. All Rights Reserved.</span></div>
    </div>
  </footer>`);

const hdr = $("#hdr");
const onScroll = () => hdr.classList.toggle("scrolled", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true }); onScroll();
const menuBtn = $("#menuBtn");
const setMenu = open => { document.body.classList.toggle("menu-open", open); menuBtn.setAttribute("aria-expanded", open); menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu"); };
menuBtn.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
$("#panel").addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

// ---------- Book pieces ----------
const book3d = b => `<div class="book3d" style="--cv:${b.cv}"><div class="back"></div><div class="spine"></div><div class="pages"></div><div class="front"><div class="art ${b.art}"></div><span class="t">${esc(b.title)}</span><span class="g">${esc(b.genre)}</span></div><div class="floor"></div></div>`;
const rightsChips = b => ["Exclusive", "Buyout"].map(r => b.rights.includes(r)
  ? `<span class="chip ok">${r === "Exclusive" ? "Exclusive licence" : "Buyout"} available</span>`
  : `<span class="chip no">${r === "Exclusive" ? "Exclusive licence" : "Buyout"} taken</span>`).join("");
const lockInner = (b, showTitle) => `
  <div class="locked-head"><span class="ch">${b.ch}</span>${showTitle ? `<span class="ttl">${esc(b.title)}</span>` : ""}</div>
  ${showTitle ? `<div class="chips"><span class="chip">${b.words} words, ${esc(b.status.toLowerCase())}</span>${rightsChips(b)}</div>` : ""}
  <p>${esc(b.text)}</p>
  <div class="lockbar"><small><svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="1" y="7" width="12" height="8" rx="1.5"/><path d="M4 7V5a3 3 0 0 1 6 0v2"/></svg>The rest is with our editors</small>
  <button class="btn" type="button" data-request="${b.id}">Request full manuscript</button></div>`;

// ---------- Home: the fan ----------
const fan = $("#fan");
if (fan) {
  let order = ["don", "signed", "spat"]; // [left, centre, right]
  const lock = $("#heroLock");
  fan.innerHTML = order.map(id => `<button class="bt" type="button" data-pick="${id}">${book3d(byId(id))}</button>`).join("");
  const layout = (swap) => {
    const pos = ["pos-l", "pos-c", "pos-r"];
    order.forEach((id, i) => {
      const el = $(`[data-pick="${id}"]`, fan), b = byId(id);
      el.className = `bt ${pos[i]}`;
      el.setAttribute("aria-pressed", i === 1);
      el.setAttribute("aria-label", i === 1 ? `${b.title}, opening shown below` : `Show the opening of ${b.title}`);
    });
    lock.innerHTML = lockInner(byId(order[1]), true);
    if (swap) { lock.classList.remove("swap"); void lock.offsetWidth; lock.classList.add("swap"); }
  };
  fan.addEventListener("click", e => {
    const bt = e.target.closest("[data-pick]");
    if (!bt) return;
    const i = order.indexOf(bt.dataset.pick);
    if (i === 0) order = [order[2], order[0], order[1]];
    else if (i === 2) order = [order[1], order[2], order[0]];
    else return;
    layout(true);
  });
  layout(false);
}

// ---------- Home: the line ----------
const qEl = $("#quote");
if (qEl) {
  let qi = 0;
  const show = (swap) => {
    const { id, q } = QUOTES[qi], b = byId(id);
    qEl.textContent = q;
    $("#quoteCite").textContent = `${b.title}, ${b.ch}`;
    $("#quoteOpen").dataset.open = id;
    if (swap) [qEl, $("#quoteCite")].forEach(el => { el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); });
  };
  $("#quoteNext").addEventListener("click", () => { qi = (qi + 1) % QUOTES.length; show(true); });
  show(false);
}

// ---------- Ticker ----------
const ticker = $("#ticker");
if (ticker) {
  const star = `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 0l2.2 7.8L20 10l-7.8 2.2L10 20l-2.2-7.8L0 10l7.8-2.2z"/></svg>`;
  const run = ["Contract Marriage", "Bride Swap", "Mafia", "Rebirth", "Second Chance", "Hockey Romance", "Fake Dating", "Dragon Fantasy", "Urban Son-in-Law", "Apocalypse", "Mountain Descent", "Age Gap"].map(t => `<span>${t}${star}</span>`).join("");
  ticker.innerHTML = run + run;
}

// ---------- Spines (inner page heroes; real titles you can pick on the catalog) ----------
const SPINE_SIZES = [[44, 232, 0], [36, 206, 0], [50, 244, 0], [40, 196, -7], [46, 226, 0], [34, 214, 0], [42, 238, 0], [38, 218, 0], [46, 200, 0]];
document.querySelectorAll("[data-spines]").forEach(el => {
  const pick = el.dataset.spines === "pick";
  el.innerHTML = BOOKS.slice(0, pick ? 9 : 7).map((b, i) => {
    const [w, h, t] = SPINE_SIZES[i];
    const spine = `<i style="--cv:${b.cv};--sw:${w}px;--sh:${h}px;--tilt:${t}deg"><span>${esc(b.title)}</span></i>`;
    return pick ? `<button type="button" data-spine="${b.id}" aria-label="Show ${esc(b.title)}">${spine}</button>` : spine;
  }).join("");
});

// Single decorative books (e.g. the About hero card)
document.querySelectorAll("[data-book]").forEach(el => { const b = byId(el.dataset.book); if (b) el.innerHTML = book3d(b); });
document.querySelectorAll("[data-thumb]").forEach(el => { const b = byId(el.dataset.thumb); if (b) { el.style.setProperty("--cv", b.cv); el.innerHTML = `<span class="art ${b.art}"></span>`; } });
document.querySelectorAll("[data-count]").forEach(el => { const k = el.dataset.count, n = BOOKS.filter(b => k === "all" || b.lead === k).length; el.textContent = `${n} ${n === 1 ? "title" : "titles"}`; });
// Catalog card rows filter the index below and bring it into view
document.addEventListener("click", e => {
  const j = e.target.closest("[data-jump]");
  if (!j) return;
  document.querySelector(`[data-lead="${j.dataset.jump}"]`)?.click();
  document.getElementById("cat")?.scrollIntoView({ behavior: "smooth" });
});

// ---------- Home: the desk (auto-advancing; the picked book stands beside the piles) ----------
const ds = $("#deskshow");
if (ds) {
  const DUR = 5000;
  const seq = [...BOOKS.filter(b => b.lead === "f"), ...BOOKS.filter(b => b.lead === "m")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const JIT = [0, 12, 4, 16, 7, 2, 10, 5, 14];
  let i = seq.findIndex(b => b.id === "signed"), timer = null, paused = reduce, hovering = false, visible = false;
  const spine = (b, n, k) => `<button class="sp" type="button" data-ds="${b.id}" aria-label="Show ${esc(b.title)}"
      style="--cv:${b.cv};--h:${Math.round((30 + parseInt(b.words, 10) / 520 * 34) * k)}px;--jit:${JIT[n % 9]}px"><b>${esc(b.title)}</b><small>${b.words}</small></button>`;
  $("#dsPiles").innerHTML = [["Romance", "f"], ["Male lead", "m"]].map(([name, lead]) =>
    `<div class="pile">${seq.filter(b => b.lead === lead).map((b, n) => spine(b, n, 1)).join("")}<span class="lbl">${name}</span></div>`).join("");
  $("#dsDots").innerHTML = seq.map((b, n) => `<button type="button" data-dot="${n}" aria-label="Show ${esc(b.title)}"></button>`).join("");
  const cards = matchMedia("(max-width: 760px)");   // phones swipe through cards instead of piles

  const ov = $("#dsOv"), bar = ds.querySelector(".ds-bar i"), playBtn = $("#dsPlay");
  // All overviews are built once and share one grid cell; render() only flips which one is visible.
  ov.innerHTML = seq.map(b => `<div class="ov-item" data-ov="${b.id}">
      <div class="ov-book">${book3d(b)}</div>
      <div class="ov-body"><span class="k">${esc(b.genre.toLowerCase())}</span><h3>${esc(b.title)}</h3><p class="hook">${esc(b.hook)}</p>
        <div class="chips"><span class="chip">${b.words} words, ${esc(b.status.toLowerCase())}</span><span class="chip ok">${b.rights.includes("Buyout") ? "Exclusive or buyout" : "Exclusive only"}</span></div>
        <div class="ov-acts"><button class="btn" type="button" data-request="${b.id}">Request full manuscript</button><button class="link" type="button" data-open="${b.id}">Read the opening</button></div></div>
    </div>`).join("");
  const items = [...ov.children];
  const render = (animate) => {
    const b = seq[i];
    ds.querySelectorAll("[data-ds]").forEach(s => { const on = s.dataset.ds === b.id; s.classList.toggle("on", on); s.setAttribute("aria-pressed", on); });
    items.forEach(el => {
      const on = el.dataset.ov === b.id;
      el.classList.toggle("on", on);
      el.inert = cards.matches ? false : !on;   // on desktop hidden overviews can't be tabbed into; on phones every card is visible
      el.classList.remove("enter");
      if (on && animate) { void el.offsetWidth; el.classList.add("enter"); }
    });
    ds.querySelectorAll("[data-dot]").forEach(d => d.setAttribute("aria-current", +d.dataset.dot === i));
    $("#dsCount").textContent = `${i + 1} of ${seq.length}`;
    // block "nearest" keeps the page itself from jumping; only the card row moves
    if (cards.matches && animate) items[i].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "center" });
  };
  // A swipe settles on a card: make that card the current title without scrolling again.
  let settle;
  ov.addEventListener("scroll", () => {
    if (!cards.matches) return;
    clearTimeout(settle);
    settle = setTimeout(() => {
      const mid = ov.scrollLeft + ov.clientWidth / 2;
      const n = items.reduce((best, el, k) => Math.abs(el.offsetLeft - ov.offsetLeft + el.clientWidth / 2 - mid) < Math.abs(items[best].offsetLeft - ov.offsetLeft + items[best].clientWidth / 2 - mid) ? k : best, 0);
      if (n !== i) { i = n; render(false); schedule(); }
    }, 120);
  }, { passive: true });
  ov.addEventListener("touchstart", () => { hovering = true; schedule(); }, { passive: true });
  ov.addEventListener("touchend", () => { hovering = false; schedule(); }, { passive: true });
  cards.addEventListener("change", () => render(false));
  const running = () => !paused && !hovering && visible;
  const schedule = () => {
    clearTimeout(timer);
    ds.classList.remove("playing"); void bar.offsetWidth;   // restart the progress line
    if (!paused && visible) ds.classList.add("playing");
    ds.classList.toggle("hold", hovering);
    if (running()) timer = setTimeout(() => go(1), DUR);
  };
  const go = d => { i = (i + d + seq.length) % seq.length; render(true); schedule(); };
  const setPaused = p => {
    paused = p;
    playBtn.setAttribute("aria-label", p ? "Play" : "Pause");
    playBtn.innerHTML = p ? `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>` : `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="3" y="2.5" width="3.5" height="11" rx="1"/><rect x="9.5" y="2.5" width="3.5" height="11" rx="1"/></svg>`;
    schedule();
  };
  ds.addEventListener("click", e => {
    const s = e.target.closest("[data-ds]"), d = e.target.closest("[data-dot]");
    if (s) { i = seq.findIndex(b => b.id === s.dataset.ds); render(true); schedule(); }
    else if (d) { i = +d.dataset.dot; render(true); schedule(); }
  });
  $("#dsPrev").addEventListener("click", () => go(-1));
  $("#dsNext").addEventListener("click", () => go(1));
  playBtn.addEventListener("click", () => setPaused(!paused));
  // Hold still while someone is reading or pointing at it; resume a full cycle afterwards.
  ds.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") { hovering = true; schedule(); } });
  ds.addEventListener("pointerleave", () => { hovering = false; schedule(); });
  ds.addEventListener("focusin", () => { hovering = true; schedule(); });
  ds.addEventListener("focusout", e => { if (!ds.contains(e.relatedTarget)) { hovering = false; schedule(); } });
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; schedule(); }, { threshold: .35 }).observe(ds);
  render(false); setPaused(paused);
}

// ---------- Catalog: rights index + live preview ----------
const cat = $("#cat");
const wide = () => matchMedia("(min-width: 961px)").matches;
if (cat) {
  const TROPES = ["Contract Marriage", "Bride Swap", "Mafia", "Rebirth", "Revenge", "Sports Romance", "Fake Dating", "Dragon", "Christmas", "Son-in-Law", "Mountain Descent", "Apocalypse"];
  const params = new URLSearchParams(location.search);
  const st = { lead: ["f", "m"].includes(params.get("lead")) ? params.get("lead") : "all", trope: null, sel: byId(params.get("open"))?.id || "signed" };
  const list = $("#index"), pv = $("#preview");
  const matches = b => (st.lead === "all" || b.lead === st.lead) && (!st.trope || `${b.genre} ${b.tags.join(" ")}`.toLowerCase().includes(st.trope.toLowerCase()));
  const rights = b => ["Exclusive", "Buyout"].map(r => `<span class="r${b.rights.includes(r) ? "" : " off"}">${r}</span>`).join("");

  const preview = (animate) => {
    const b = byId(st.sel);
    pv.innerHTML = `<div class="pv-book">${book3d(b)}</div>
      <div class="pv-text"><h3>${esc(b.title)}</h3><p class="hook">${esc(b.hook)}</p>
      <dl class="facts"><div><dt>Words</dt><dd>${b.words}</dd></div><div><dt>Chapters</dt><dd>${b.chapters}</dd></div><div><dt>Status</dt><dd>${esc(b.status)}</dd></div></dl>
      <div class="locked">${lockInner(b, false)}</div></div>`;
    if (animate) { pv.classList.remove("enter"); void pv.offsetWidth; pv.classList.add("enter"); }
  };
  const draw = () => {
    const shown = BOOKS.filter(matches);
    if (shown.length && !shown.some(b => b.id === st.sel)) st.sel = shown[0].id;
    $("#count").textContent = `${shown.length} ${shown.length === 1 ? "title" : "titles"}`;
    list.innerHTML = shown.length ? shown.map(b => `<li><button class="row${b.id === st.sel ? " on" : ""}" type="button" data-row="${b.id}" aria-pressed="${b.id === st.sel}">
        <span class="thumb" style="--cv:${b.cv}"><span class="art ${b.art}"></span></span>
        <span><h3>${esc(b.title)}</h3><span class="hook">${esc(b.hook)}</span><span class="m">${b.words} words, ${esc(b.status.toLowerCase())}</span></span>
        <span class="wd">${b.words}<small>${esc(b.status)}</small></span><span class="rt">${rights(b)}</span></button></li>`).join("")
      : `<li class="empty">No titles match this trope yet.<br><button class="btn dark" type="button" data-clear>Clear the filter</button></li>`;
    document.querySelectorAll("[data-spine]").forEach(s => s.classList.toggle("on", s.dataset.spine === st.sel));
    document.querySelectorAll("[data-lead]").forEach(s => s.setAttribute("aria-pressed", s.dataset.lead === st.lead));
    document.querySelectorAll("[data-trope]").forEach(s => s.setAttribute("aria-pressed", s.dataset.trope === st.trope));
    if (shown.length) preview(false);
  };
  $("#tropes").innerHTML = TROPES.map(t => `<button class="trope" type="button" data-trope="${t}" aria-pressed="false">${t}</button>`).join("");

  const choose = (id, fromSpine) => {
    st.sel = id;
    if (!BOOKS.filter(matches).some(b => b.id === id)) { st.lead = "all"; st.trope = null; }
    draw();
    if (wide()) preview(true); else openSheet(byId(id));
    if (fromSpine && wide()) cat.scrollIntoView({ behavior: "smooth" });
  };
  cat.addEventListener("click", e => {
    const r = e.target.closest("[data-row]"), l = e.target.closest("[data-lead]"), t = e.target.closest("[data-trope]");
    if (r) choose(r.dataset.row);
    else if (l) { st.lead = l.dataset.lead; draw(); preview(true); }
    else if (t) { st.trope = st.trope === t.dataset.trope ? null : t.dataset.trope; draw(); preview(true); }
    else if (e.target.closest("[data-clear]")) { st.trope = null; st.lead = "all"; draw(); }
  });
  document.addEventListener("click", e => { const s = e.target.closest("[data-spine]"); if (s) choose(s.dataset.spine, true); });
  draw();
}

// ---------- Title sheet ----------
let dlg;
function openSheet(b) {
  if (!dlg) { document.body.insertAdjacentHTML("beforeend", `<dialog id="dlg" aria-labelledby="dlgTitle"><div class="ts" id="ts"></div></dialog>`); dlg = $("#dlg"); }
  $("#ts").innerHTML = `<button class="x" type="button" data-close aria-label="Close">×</button>
    <div class="ts-top"><div class="bk">${book3d(b)}</div><div>
      <h3 id="dlgTitle">${esc(b.title)}</h3><p class="hook">${esc(b.hook)}</p>
      <div class="chips">${b.tags.map(t => `<span class="chip">${esc(t)}</span>`).join("")}</div></div></div>
    <dl class="facts"><div><dt>Words</dt><dd>${b.words}</dd></div><div><dt>Chapters</dt><dd>${b.chapters}</dd></div><div><dt>Status</dt><dd>${esc(b.status)}</dd></div></dl>
    <div class="chips">${rightsChips(b)}</div>
    <div class="locked">${lockInner(b, false)}</div>`;
  dlg.showModal();
  $("#ts").scrollTop = 0;
}
const openParam = byId(new URLSearchParams(location.search).get("open"));
if (openParam && !(cat && wide())) openSheet(openParam); // on a wide catalog the preview panel shows it instead

// ---------- Requests carry across pages ----------
const store = {
  get() { try { return JSON.parse(sessionStorage.getItem("dr-picks") || "[]").filter(byId); } catch { return []; } },
  set(v) { try { sessionStorage.setItem("dr-picks", JSON.stringify(v)); } catch {} }
};
document.addEventListener("click", e => {
  const o = e.target.closest("[data-open]");
  if (o) { openSheet(byId(o.dataset.open)); return; }
  if (e.target.closest("[data-close]") || (dlg && e.target === dlg)) { dlg.close(); return; }
  const r = e.target.closest("[data-request]");
  if (r) {
    const picks = store.get();
    if (!picks.includes(r.dataset.request)) picks.push(r.dataset.request);
    store.set(picks);
    location.href = `contact.html?add=${encodeURIComponent(r.dataset.request)}#inquiry`;
  }
});

// ---------- Contact form ----------
const form = $("#form");
if (form) {
  const picked = $("#picked"), hidden = $("#titles");
  let picks = store.get();
  const add = new URLSearchParams(location.search).get("add");
  if (byId(add) && !picks.includes(add)) picks.push(add); // works even when sessionStorage is blocked
  const draw = () => {
    picked.innerHTML = picks.map(id => `<button type="button" data-unpick="${id}" aria-label="Remove ${esc(byId(id).title)}">${esc(byId(id).title)}<span aria-hidden="true">×</span></button>`).join("");
    hidden.value = picks.map(id => byId(id).title).join(", ");
    store.set(picks);
  };
  picked.addEventListener("click", e => { const u = e.target.closest("[data-unpick]"); if (u) { picks = picks.filter(id => id !== u.dataset.unpick); draw(); } });
  draw();
  if (add) addEventListener("load", () => { $("#inquiry").scrollIntoView({ behavior: "instant" }); $("#company").focus({ preventScroll: true }); });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const sent = $("#sent"), email = $("#email");
    const missing = ["company", "role", "email"].filter(id => !$("#" + id).value.trim());
    sent.hidden = false;
    if (missing.length) { sent.textContent = "Add your platform, name and role, and work email so our team can reply."; $("#" + missing[0]).focus(); return; }
    if (!email.checkValidity()) { sent.textContent = "Check the work email: it needs an @ and a domain."; email.focus(); return; }
    sent.textContent = `This is a mockup, so nothing was sent. On the live site this goes to ${MAIL} and an editor replies with samples.`;
  });
  $("#copyMail")?.addEventListener("click", async e => {
    try { await navigator.clipboard.writeText(MAIL); e.target.textContent = "Copied"; }
    catch { getSelection().selectAllChildren($("#mail")); e.target.textContent = "Selected"; }
    setTimeout(() => e.target.textContent = "Copy", 1800);
  });
}

// ---------- Motion: headline rise, scroll reveals, paper tilt, header light ----------
// Everything here is progressive: classes are added by script, so without JS (or with reduced motion) content just shows.
(() => {
  const fine = matchMedia("(pointer: fine)").matches;
  if (fine) hdr.addEventListener("pointermove", e => hdr.style.setProperty("--mx", `${e.clientX - hdr.getBoundingClientRect().left}px`));
  if (fine) hdr.addEventListener("pointerleave", () => hdr.style.removeProperty("--mx"));

  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

  // Text and sections fade in gently as they arrive (opacity only, no movement), with a short stagger between siblings.
  const SEL = [".hero-copy > *", ".page-hero .wrap > div > *", ".split-head", ".duo .copy > *", ".desk", ".models .model", ".steps li", ".faq details", ".formats > div", ".toc li",
    ".rights", ".contact .details", ".next", ".contact form", ".write > div", ".foot-link", ".line .side", ".line blockquote", ".end h2", ".deskshow"].join(",");
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }),
    { rootMargin: "0px 0px -8% 0px", threshold: .1 });
  document.querySelectorAll(SEL).forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.matches(SEL));
    el.style.setProperty("--d", `${Math.min(sibs.indexOf(el), 6) * 80}ms`);
    el.classList.add("rv");
    io.observe(el);
  });
  // Safety net: if the observer is throttled (background tabs, low-power modes), never leave on-screen content hidden.
  const sweep = () => document.querySelectorAll(".rv:not(.in)").forEach(el => { if (el.getBoundingClientRect().top < innerHeight * .96) el.classList.add("in"); });
  let tick = 0;
  addEventListener("scroll", () => { if (!tick) tick = setTimeout(() => { tick = 0; sweep(); }, 250); }, { passive: true });
  setTimeout(sweep, 1500);

})();
