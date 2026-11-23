// Outliner desk: review applications, score assessments, accept with a rate, log monthly batches and pay.
// Everything it can see or change is enforced by the database rules in supabase/schema.sql, not by this file.
import { CRITERIA, total, average, payWindow, payout, money } from "./admin-calc.js";

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const STATUS = { new: "New", review: "Under review", accepted: "Accepted", rejected: "Rejected", banned: "Banned" };
const FILTERS = [["new", "New"], ["review", "Under review"], ["accepted", "Accepted"], ["rejected", "Rejected"], ["banned", "Banned"], ["all", "All"]];
const PARTS = [["blurb", "Blurb"], ["story_outline", "Full story outline"], ["characters", "Character profiles"], ["chapter_1", "Chapter 1 outline"], ["chapter_2", "Chapter 2 outline"], ["chapter_3", "Chapter 3 outline"]];
const date = d => new Date(d).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });

let db, me, apps = [], scores = [], batches = [], current = null, filter = "new", query = "";
const notice = (msg, isError) => { const n = $("#notice"); n.hidden = !msg; n.textContent = msg || ""; n.classList.toggle("err", !!isError); };
const fail = (what, error) => { console.error(error); notice(`Couldn't ${what}: ${error.message}. Nothing was changed; try again.`, true); };

// ---------- Sign in ----------
const cfg = window.DR_SUPABASE;
if (!cfg?.url || !window.supabase) {
  notice("The dashboard isn't connected yet. Add your Supabase project URL and anon key to assets/config.js.", true);
} else {
  db = window.supabase.createClient(cfg.url, cfg.anonKey);
  const { data } = await db.auth.getSession();
  data.session ? start(data.session) : ($("#login").hidden = false);
}

$("#login").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = e.target.querySelector("button"); btn.disabled = true; $("#loginErr").textContent = "";
  const { data, error } = await db.auth.signInWithPassword({ email: $("#lEmail").value.trim(), password: $("#lPass").value });
  btn.disabled = false;
  if (error) { $("#loginErr").textContent = "That email and password don't match a team account."; return; }
  start(data.session);
});
$("#signOut").addEventListener("click", async () => { await db.auth.signOut(); location.reload(); });

async function start(session) {
  me = session.user.email.toLowerCase();
  const { data: admin } = await db.from("admins").select("email").eq("email", me);
  if (!admin?.length) { await db.auth.signOut(); $("#login").hidden = false; $("#loginErr").textContent = `${me} isn't on the admin list. Add it in Supabase to sign in.`; return; }
  $("#login").hidden = true; $("#tabs").hidden = false; $("#signOut").hidden = false; $("#me").textContent = me;
  $("#statusFilter").innerHTML = FILTERS.map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${k === filter}">${l}<b data-n="${k}"></b></button>`).join("");
  show("apps");
  await load();
}

async function load() {
  const [a, s, b] = await Promise.all([
    db.from("applications").select("*").order("created_at", { ascending: false }),
    db.from("scores").select("*"),
    db.from("batches").select("*").order("month", { ascending: false })]);
  const error = a.error || s.error || b.error;
  if (error) return fail("load applications", error);
  apps = a.data; scores = s.data; batches = b.data; notice("");
  renderList(); renderDetail(); renderPay();
}

// ---------- Tabs ----------
function show(tab) {
  document.querySelectorAll("[data-tab]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tab === tab));
  $("#apps").hidden = tab !== "apps"; $("#pay").hidden = tab !== "pay";
}
$("#tabs").addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b) show(b.dataset.tab); });
$("#refresh").addEventListener("click", load);

// ---------- Application list ----------
const scoresFor = id => scores.filter(s => s.application_id === id);
function renderList() {
  FILTERS.forEach(([k]) => { const n = k === "all" ? apps.length : apps.filter(a => a.status === k).length; $(`[data-n="${k}"]`).textContent = n; });
  const q = query.toLowerCase();
  const shown = apps.filter(a => (filter === "all" || a.status === filter) &&
    (!q || [a.name, a.email, ...a.genres].some(v => v.toLowerCase().includes(q))));
  $("#appList").innerHTML = shown.length ? shown.map(a => {
    const avg = average(scoresFor(a.id));
    return `<li><button type="button" data-id="${a.id}" aria-current="${a.id === current}">
      <span class="who"><b>${esc(a.name)}</b><small>${esc(a.email)} · ${date(a.created_at)}</small></span>
      <span class="meta">${a.prior_ban ? '<i class="flag">Banned before</i>' : ""}<i class="pill s-${a.status}">${STATUS[a.status]}</i>
      <i class="avg">${avg === null ? "Not scored" : `${avg} / 25`}</i></span></button></li>`;
  }).join("") : `<li class="empty">No ${filter === "all" ? "" : STATUS[filter].toLowerCase() + " "}applications${q ? " match that search" : " yet"}.</li>`;
}
$("#statusFilter").addEventListener("click", e => {
  const b = e.target.closest("[data-f]"); if (!b) return;
  filter = b.dataset.f; document.querySelectorAll("[data-f]").forEach(x => x.setAttribute("aria-pressed", x === b)); renderList();
});
$("#search").addEventListener("input", e => { query = e.target.value.trim(); renderList(); });
$("#appList").addEventListener("click", e => {
  const b = e.target.closest("[data-id]"); if (!b) return;
  current = b.dataset.id; renderList(); renderDetail();
  if (matchMedia("(max-width: 900px)").matches) $("#detail").scrollIntoView({ behavior: "smooth" });
});

// ---------- Application detail ----------
function renderDetail() {
  const a = apps.find(x => x.id === current), el = $("#detail");
  if (!a) { el.innerHTML = `<p class="empty">Pick an application to read the assessment and score it.</p>`; return; }
  const all = scoresFor(a.id), mine = all.find(s => s.reviewer === me) || {}, others = all.filter(s => s.reviewer !== me), avg = average(all);
  el.innerHTML = `
    <header class="d-head">
      <div><h2>${esc(a.name)}</h2><p><a href="mailto:${esc(a.email)}">${esc(a.email)}</a> · applied ${date(a.created_at)}</p></div>
      <i class="pill s-${a.status}">${STATUS[a.status]}${a.status === "accepted" ? ` · ${money(Number(a.rate))} per outline` : ""}</i>
    </header>
    ${a.prior_ban ? `<p class="d-warn">This email or name matches an outliner you banned before.</p>` : ""}
    <dl class="d-facts">
      <div><dt>Book with 5,000+ views</dt><dd><a href="${esc(a.book_link)}" target="_blank" rel="noopener noreferrer">${esc(a.book_link)}</a></dd></div>
      <div><dt>Genres</dt><dd>${a.genres.length ? a.genres.map(esc).join(", ") : "None picked"}</dd></div>
      <div><dt>Declaration</dt><dd>Confirmed 100% human-written</dd></div>
      ${a.message ? `<div><dt>Message</dt><dd>${esc(a.message)}</dd></div>` : ""}
    </dl>
    <h3>Assessment</h3>
    ${a.file_path ? `<p><button type="button" class="btn ghost" id="openFile">Open attached document</button></p>` : ""}
    ${PARTS.filter(([k]) => a[k]).map(([k, l]) => `<section class="d-part"><h4>${l}</h4><p>${esc(a[k])}</p></section>`).join("")}

    <form class="d-score" id="scoreForm">
      <h3>Your score <small>${avg === null ? "" : `Team average ${avg} / 25`}</small></h3>
      ${CRITERIA.map(([k, l]) => `<fieldset class="d-crit"><legend>${l}</legend>${[1, 2, 3, 4, 5].map(n =>
        `<label><input type="radio" name="${k}" value="${n}" required${mine[k] === n ? " checked" : ""}><span>${n}</span></label>`).join("")}</fieldset>`).join("")}
      <div class="f"><label for="sNote">Note for your partner</label><textarea id="sNote" rows="2">${esc(mine.note)}</textarea></div>
      <button class="btn" type="submit">${mine.reviewer ? "Update my score" : "Save my score"}</button>
      ${others.map(s => `<p class="d-other"><b>${esc(s.reviewer)}</b> scored ${total(s)} / 25${s.note ? `: “${esc(s.note)}”` : ""}</p>`).join("")}
    </form>

    <div class="d-actions">
      <h3>Decision</h3>
      <div class="d-accept"><label for="rate">Rate per chapter outline</label>
        <input id="rate" type="number" min="0.50" max="5.00" step="0.05" value="${a.rate ?? ""}" placeholder="0.50 to 5.00">
        <button type="button" class="btn" data-set="accepted">Accept</button></div>
      <div class="d-btns">
        <button type="button" class="btn ghost" data-set="review">Mark under review</button>
        <button type="button" class="btn ghost" data-set="rejected">Reject</button>
        <button type="button" class="btn danger" data-set="banned">Ban for AI use</button>
      </div>
    </div>`;
}

$("#detail").addEventListener("click", async e => {
  const a = apps.find(x => x.id === current);
  if (e.target.id === "openFile") {
    const { data, error } = await db.storage.from("assessments").createSignedUrl(a.file_path, 600);
    return error ? fail("open the document", error) : window.open(data.signedUrl, "_blank", "noopener");
  }
  const b = e.target.closest("[data-set]"); if (!b) return;
  const status = b.dataset.set, change = { status };
  if (status === "accepted") {
    const rate = Number($("#rate").value);
    if (!(rate >= 0.5 && rate <= 5)) { $("#rate").focus(); return notice("Set a rate between $0.50 and $5.00 before accepting.", true); }
    change.rate = rate;
  }
  if (status === "banned" && !confirm(`Ban ${a.name} for AI use? They are flagged if they apply again.`)) return;
  const { error } = await db.from("applications").update(change).eq("id", a.id);
  if (error) return fail("update the application", error);
  Object.assign(a, change); notice(`${a.name}: ${STATUS[status]}.`); renderList(); renderDetail(); renderPay();
});

$("#detail").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, row = { application_id: current, note: $("#sNote").value.trim() || null, updated_at: new Date().toISOString() };
  CRITERIA.forEach(([k]) => row[k] = Number(f.elements[k].value));
  const { error } = await db.from("scores").upsert(row, { onConflict: "application_id,reviewer" });
  if (error) return fail("save your score", error);
  scores = scores.filter(s => !(s.application_id === current && s.reviewer === me)).concat({ ...row, reviewer: me });
  notice("Score saved."); renderList(); renderDetail();
});

// ---------- Outliners & pay ----------
function renderPay() {
  const team = apps.filter(a => a.status === "accepted");
  const due = {};
  batches.filter(b => !b.paid).forEach(b => {
    const a = apps.find(x => x.id === b.application_id); if (!a) return;
    const w = payWindow(b.month); (due[w.key] ??= { label: w.label, sum: 0 }).sum += payout(b.approved, a.rate);
  });
  const windows = Object.keys(due).sort();
  $("#due").innerHTML = `<h2>Unpaid</h2>${windows.length ? `<ul>${windows.map(k => `<li><span>${due[k].label}</span><b>${money(due[k].sum)}</b></li>`).join("")}</ul>` : "<p>Nothing owed right now.</p>"}`;
  $("#outliners").innerHTML = team.length ? team.map(a => {
    const rows = batches.filter(b => b.application_id === a.id);
    return `<article class="o-card" data-app="${a.id}">
      <header><h3>${esc(a.name)}</h3><span>${money(Number(a.rate))} per outline</span></header>
      <table><thead><tr><th>Month</th><th>Sent</th><th>Approved</th><th>Owed</th><th>Paid on</th><th></th></tr></thead><tbody>
      ${rows.map(b => `<tr><td>${new Date(b.month).toLocaleDateString("en", { month: "long", year: "numeric", timeZone: "UTC" })}</td><td>${b.submitted}</td><td>${b.approved}</td>
        <td>${money(payout(b.approved, a.rate))}</td><td>${payWindow(b.month).label}</td>
        <td><label class="paid"><input type="checkbox" data-paid="${b.id}"${b.paid ? " checked" : ""}> Paid</label></td></tr>`).join("") || `<tr><td colspan="6" class="empty">No batches yet.</td></tr>`}
      </tbody></table>
      <form class="o-add"><label>Month <input type="month" name="month" required></label>
        <label>Sent <input type="number" name="submitted" min="0" required></label>
        <label>Approved <input type="number" name="approved" min="0" required></label>
        <button class="btn" type="submit">Add batch</button></form>
    </article>`;
  }).join("") : `<p class="empty">Accepted outliners appear here with their monthly batches.</p>`;
}

$("#outliners").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, id = f.closest("[data-app]").dataset.app;
  const row = { application_id: id, month: `${f.elements.month.value}-01`, submitted: Number(f.elements.submitted.value), approved: Number(f.elements.approved.value) };
  if (row.approved > row.submitted) return notice("Approved can't be more than sent.", true);
  const { data, error } = await db.from("batches").insert(row).select().single();
  if (error?.code === "23505") return notice(`${f.elements.month.value} is already logged for this outliner.`, true);
  if (error) return fail("add the batch", error);
  batches.unshift(data); notice("Batch added."); renderPay();
});
$("#outliners").addEventListener("change", async e => {
  const id = e.target.dataset.paid; if (!id) return;
  const { error } = await db.from("batches").update({ paid: e.target.checked }).eq("id", id);
  if (error) { e.target.checked = !e.target.checked; return fail("mark the batch", error); }
  batches.find(b => b.id === id).paid = e.target.checked; renderPay();
});
