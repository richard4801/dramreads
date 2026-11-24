// The desk: sign-in gate, sidebar shell and hash router (#/view/id/sub).
import { $, $$, esc, connect, loadAll, toast, explain, ICON, initials, closeDrawer, drawer, linkBack, needsPassword, passwordScreen } from "./core.js";
import { VIEWS, counts } from "./views.js";

const NAV = [
  [null, [["overview", "Overview"]]],
  ["People", [["applications", "Applications"], ["outliners", "Outliners"], ["writers", "Writers"]]],
  ["Work", [["stories", "Story board"], ["deals", "Platform deals"], ["payroll", "Payroll"]]],
  ["Settings", [["team", "Team"]]],
];
const TITLES = Object.fromEntries(NAV.flatMap(([, items]) => items));
// Phone tab bar, like the public site's: two sections, a raised "New" button, one section, More.
const TABS = [["overview", "Overview"], ["applications", "Applications"], ["stories", "Stories"]];
const MORE = ["payroll", "outliners", "writers", "deals", "team"];
const CREATE = [["#/stories/new", "stories", "New story"], ["#/deals/new", "deals", "New deal"], ["#/writers/log", "writers", "Log chapters"], ["#/writers/new", "outliners", "Add a writer"], ["#/deals/platforms", "deals", "Add a platform"]];
const root = $("#root");
const db = connect();
let me = null;

const SIDE = `<div class="gate-side"><a class="brand" href="home.html">dram<i>reads</i><small>the desk</small></a>
  <div><blockquote>Every story, every outliner, every deal. One desk.</blockquote><p>Applications, the story board, platform deals and payroll for the dramreads team.</p></div></div>`;

function gate(message = "") {
  root.innerHTML = `<div class="gate">${SIDE}
    <div class="gate-form"><form id="login" novalidate>
      <h1>Sign in</h1>
      <div class="fld"><label for="lEmail">Email</label><input id="lEmail" type="email" autocomplete="username" required></div>
      <div class="fld"><label for="lPass">Password</label><input id="lPass" type="password" autocomplete="current-password"></div>
      <button class="dk-btn" id="signBtn">Sign in</button>
      <button type="button" class="dk-btn ghost" id="linkBtn">First time, or forgot your password?</button>
      <p class="err" id="loginErr" role="status">${esc(message)}</p>
      <p class="muted small">Outliners sign in at the <a href="portal.html">outliner portal</a>.</p>
    </form></div></div>`;
  const out = $("#loginErr"), mail = $("#lEmail"), email = () => mail.value.trim().toLowerCase();
  $("#login").onsubmit = async e => {
    e.preventDefault();
    if (!db) return;
    if (!mail.checkValidity() || !email()) { mail.focus(); return out.textContent = "Enter your email."; }
    if (!$("#lPass").value) { $("#lPass").focus(); return out.textContent = "Enter your password, or use the link below if you haven't set one yet."; }
    const btn = $("#signBtn"); btn.disabled = true;
    const { data, error } = await db.auth.signInWithPassword({ email: email(), password: $("#lPass").value });
    btn.disabled = false;
    error ? (out.textContent = "That email and password don't match. First time here? Use the link below to set your password.") : start(data.session);
  };
  // The emailed link lands on "Create your password", never straight in.
  $("#linkBtn").onclick = async () => {
    if (!db) return;
    if (!mail.checkValidity() || !email()) { mail.focus(); return out.textContent = "Enter your email first, then we'll send the link."; }
    const btn = $("#linkBtn"); btn.disabled = true;
    const { error } = await db.auth.signInWithOtp({ email: email(), options: { emailRedirectTo: linkBack() } });
    btn.disabled = false;
    out.textContent = error ? explain(error) : `Check ${email()} for a link to set your password. It works once, for an hour.`;
  };
  mail.focus();
}

async function start(session) {
  me = session.user.email.toLowerCase();
  const { data: admin } = await db.from("admins").select("email").eq("email", me);
  if (!admin?.length) { me = null; await db.auth.signOut(); return gate(`${session.user.email} isn't on the team. Ask a partner to invite you from the desk's Team page.`); }
  if (needsPassword(session)) await passwordScreen(root, db, SIDE);
  try { await loadAll(db); } catch (err) { return gate(`Couldn't load the desk: ${explain(err)}`); }
  shell();
  addEventListener("hashchange", route);
  route();
}

function shell() {
  root.innerHTML = `<div class="desk" id="desk">
    <aside class="side" id="side">
      <a class="brand" href="#/overview">dram<i>reads</i><small>the desk</small></a>
      <nav aria-label="Desk">${NAV.map(([label, items]) => `${label ? `<span class="nav-label">${label}</span>` : ""}${items.map(([k, l]) => `<a href="#/${k}" data-nav="${k}">${ICON[k]}<span>${l}</span><b data-count="${k}" hidden></b></a>`).join("")}`).join("")}</nav>
      <div class="me"><span class="avatar">${esc(initials(me.split("@")[0]))}</span><span>${esc(me)}</span><button type="button" class="dk-icon" id="signOut" aria-label="Sign out" title="Sign out">${ICON.out}</button></div>
    </aside>
    <div class="body">
      <div class="mobile-bar"><a class="brand" href="#/overview">dram<i>reads</i></a><span class="title" id="mTitle"></span><button type="button" class="avatar" id="meBtn" aria-label="Account and more">${esc(initials(me.split("@")[0]))}</button></div>
      <main class="main" id="view" tabindex="-1"></main>
    </div>
    <nav class="tabbar" aria-label="Desk sections">${TABS.slice(0, 2).map(tab).join("")}
      <button type="button" class="fab" id="newBtn" aria-label="Create something new"><span class="ic">${ICON.plus}</span>New</button>
      ${TABS.slice(2).map(tab).join("")}
      <button type="button" data-nav="more" id="moreBtn"><span class="ic">${ICON.menu}</span>More<b data-count="more" hidden></b></button></nav>
  </div>`;
  const signOut = async () => { await db.auth.signOut(); location.hash = ""; location.reload(); };
  $("#signOut").onclick = signOut;
  // Phones: the sections that don't fit the tab bar, plus the account, in a bottom sheet.
  $("#moreBtn").onclick = $("#meBtn").onclick = () => {
    const c = counts();
    drawer({ title: "More", sub: esc(me),
      body: `<nav class="more-list">${MORE.map(k => `<a href="#/${k}">${ICON[k]}<span>${TITLES[k]}</span>${c[k] ? `<b>${c[k]}</b>` : ""}</a>`).join("")}</nav>
        <button type="button" class="dk-btn ghost" id="sheetSignOut">${ICON.out} Sign out</button>` });
    $("#sheetSignOut").onclick = signOut;
  };
  $("#newBtn").onclick = () => drawer({ title: "Create", sub: "Add something to the desk.",
    body: `<nav class="more-list">${CREATE.map(([href, icon, label]) => `<a href="${href}">${ICON[icon]}<span>${label}</span></a>`).join("")}</nav>` });
}
const tab = ([k, l]) => `<a href="#/${k}" data-nav="${k}"><span class="ic">${ICON[k]}</span>${l}<b data-count="${k}" hidden></b></a>`;

let lastView = null;
function route() {
  const [name = "overview", id, sub] = location.hash.replace(/^#\/?/, "").split("/");
  const view = VIEWS[name] ? name : "overview";
  $$(".drawer").forEach(d => closeDrawer(d));
  $$("[data-nav]").forEach(a => a.setAttribute("aria-current", a.dataset.nav === view || (a.dataset.nav === "more" && MORE.includes(view)) ? "page" : "false"));
  const c = counts(); c.more = MORE.reduce((n, k) => n + (c[k] || 0), 0);
  Object.entries(c).forEach(([k, n]) => $$(`[data-count="${k}"]`).forEach(b => { b.hidden = !n; b.textContent = n; }));
  $("#mTitle").textContent = TITLES[view];
  document.title = `${TITLES[view]} · dramreads desk`;
  const el = $("#view");
  VIEWS[view](el, ctx, id, sub);
  if (view !== lastView) { scrollTo(0, 0); el.focus({ preventScroll: true }); lastView = view; }
}

const ctx = {
  db, get me() { return me; },
  go: hash => (location.hash === hash ? route() : (location.hash = hash)),
  rerender: () => route(),
};

if (!db) gate("The desk isn't connected yet. Add your Supabase project to assets/config.js.");
else {
  const { data } = await db.auth.getSession();
  data.session ? start(data.session) : gate();
  // Arriving from an emailed link (or the demo) signs in after load.
  db.auth.onAuthStateChange((ev, session) => { if (ev === "SIGNED_IN" && session && !me) start(session); });
}
