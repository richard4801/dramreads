// Every screen of the desk. Each view renders into `el` from the in-memory store and saves through core.save.
import { $, $$, esc, day, initials, plural, S, byId, save, remove, openFile, drawer, closeDrawer, confirmBox, toast, explain, ICON, linkBack } from "./core.js";
import { CRITERIA, total, average, money, payout, monthOf, monthLabel, payWindow, approvalRate, payroll, daysUntil } from "./calc.js";

export const STAGES = [["outline", "Outline"], ["writing", "Writing"], ["editing", "Editing"], ["ready", "Ready to pitch"], ["pitched", "Pitched"], ["signed", "Signed"], ["declined", "Declined"]];
const STAGE = Object.fromEntries(STAGES);
const APP_STATUS = { new: "New", review: "Under review", accepted: "Accepted", rejected: "Rejected", banned: "Banned" };
const PARTS = [["blurb", "Blurb"], ["story_outline", "Full story outline"], ["characters", "Character profiles"], ["chapter_1", "Chapter 1 outline"], ["chapter_2", "Chapter 2 outline"], ["chapter_3", "Chapter 3 outline"]];
const today = () => new Date().toISOString().slice(0, 10);
const outliners = () => S.applications.filter(a => a.status === "accepted");
const nameOf = (table, id) => byId(table, id)?.name ?? "";
const face = (name, cls = "") => `<span class="avatar ${cls}" title="${esc(name)}">${esc(initials(name))}</span>`;
const pill = (cls, label) => `<span class="pill ${cls}">${esc(label[0].toUpperCase() + label.slice(1))}</span>`;
const whole = n => `$${Math.round(n).toLocaleString("en")}`; // headline figures; exact cents live in Payroll
const since = d => { const n = Math.floor((Date.now() - Date.parse(d)) / 864e5); return n < 1 ? "today" : n === 1 ? "yesterday" : n < 30 ? `${n}d ago` : day(d); };
const head = (title, sub, actions = "") => `<header class="page-head"><div><h1>${esc(title)}</h1>${sub ? `<p>${sub}</p>` : ""}</div><div class="actions">${actions}</div></header>`;
const empty = (title, body) => `<div class="empty"><b>${esc(title)}</b>${esc(body)}</div>`;
const fail = err => { console.error(err); toast(explain(err), true); };
const lookup = rows => Object.fromEntries(rows.map(r => [r.id, r]));
const pay = () => payroll({ batches: S.batches, writerLogs: S.writer_logs, outliners: lookup(S.applications), writers: lookup(S.writers) });

// Nav badges
export const counts = () => ({
  applications: S.applications.filter(a => a.status === "new").length,
  outliners: S.batches.filter(b => b.status === "submitted").length,
  stories: S.stories.filter(s => !["signed", "declined"].includes(s.stage) && daysUntil(s.due_on) < 0).length,
});

// ============ Overview ============
function overview(el, ctx) {
  const windows = pay(), next = windows.find(w => w.owed > 0);
  const active = S.stories.filter(s => !["signed", "declined"].includes(s.stage));
  const signed = S.deals.filter(d => d.status === "signed");
  const open = S.deals.filter(d => ["pitched", "negotiating"].includes(d.status));
  const thisMonth = monthOf(new Date());
  const approvedThisMonth = S.batches.filter(b => b.status === "approved" && b.month === thisMonth).reduce((n, b) => n + b.approved, 0);
  const c = counts();

  const shelfStages = STAGES.filter(([k]) => k !== "declined");
  const per = shelfStages.map(([k, l]) => [k, l, S.stories.filter(s => s.stage === k).length]);
  const max = Math.max(1, ...per.map(p => p[2]));

  const todo = [
    ...S.applications.filter(a => a.status === "new" && !S.scores.some(s => s.application_id === a.id && s.reviewer === ctx.me))
      .map(a => [`#/applications/${a.id}`, "Score", a.prior_ban ? `${a.name} (banned before)` : a.name, `applied ${since(a.created_at)}`]),
    ...S.batches.filter(b => b.status === "submitted")
      .map(b => [`#/outliners/batch/${b.id}`, "Approve", `${nameOf("applications", b.application_id)} · ${monthLabel(b.month).split(" ")[0]} batch`, plural(b.submitted, "outline")]),
    ...active.filter(s => daysUntil(s.due_on) < 0)
      .map(s => [`#/stories/${s.id}`, "Late", s.title, `${-daysUntil(s.due_on)}d past due`]),
    ...open.filter(d => (Date.now() - Date.parse(d.created_at)) / 864e5 > 14)
      .map(d => [`#/deals/${d.id}`, "Chase", `${nameOf("platforms", d.platform_id)} · ${byId("stories", d.story_id)?.title ?? "a story"}`, `pitched ${since(d.created_at)}`]),
  ];
  const waiting = S.batches.filter(b => b.status === "submitted").reduce((n, b) => n + b.submitted, 0);

  el.innerHTML = `
    ${head(`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}`, new Date().toLocaleDateString("en", { weekday: "long", day: "numeric", month: "long" }),
      `<a class="dk-btn ghost" href="#/stories/new">${ICON.plus} New story</a><a class="dk-btn" href="#/deals/new">${ICON.plus} New deal</a>`)}
    <nav class="ledger" aria-label="At a glance">
      <a href="#/applications" class="${c.applications ? "hot" : ""}"><b>${c.applications}</b><span>New applications</span><small>${S.applications.filter(a => a.status === "review").length} under review</small></a>
      <a href="#/outliners" class="${c.outliners ? "hot" : ""}"><b>${c.outliners}</b><span>Batches to approve</span><small>${waiting ? `${waiting} outlines waiting` : `${approvedThisMonth} approved this month`}</small></a>
      <a href="#/stories"><b>${active.length}</b><span>Stories in progress</span><small>${c.stories ? `${c.stories} past due` : "none past due"}</small></a>
      <a href="#/deals"><b>${whole(signed.reduce((n, d) => n + Number(d.value || 0), 0))}</b><span>Signed deal value</span><small>${plural(open.length, "deal")} in talks</small></a>
      <a href="#/payroll"><b>${whole(next?.owed || 0)}</b><span>Owed next payday</span><small>${next ? `${next.label.replace(/, \d{4}$/, "")} · ${plural(next.lines.filter(l => !l.paid).length, "person", "people")}` : "nothing owed"}</small></a>
    </nav>
    <div class="grid-2">
      <section class="card"><header><h2>Needs you</h2>${todo.length ? `<span class="count">${todo.length}</span>` : ""}</header>
        ${todo.length ? `<ul class="todo">${todo.slice(0, 9).map(([href, tag, label, meta]) => `<li><a href="${href}"><span class="tag t-${tag.toLowerCase()}">${tag}</span><span class="what"><b>${esc(label)}</b><small>${esc(meta)}</small></span><i aria-hidden="true">›</i></a></li>`).join("")}</ul>` : empty("All clear", "Nothing is waiting on you right now.")}
      </section>
      <div class="stack">
        <section class="card">
          <header><h2>The shelf</h2><a href="#/stories">Story board</a></header>
          <div class="shelf">${per.map(([k, l, n], i) => `<a class="spine${i >= 3 ? " dark" : ""}" href="#/stories" style="--c: var(--st-${k}); height: ${44 + n / max * 56}%" title="${l}: ${n}"><b>${n}</b><span>${l.split(" ")[0]}</span></a>`).join("")}</div>
          <p class="shelf-legend"><span>${plural(S.stories.length, "story", "stories")}</span><span>${plural(outliners().length, "outliner")} · ${plural(S.writers.filter(w => w.status === "active").length, "writer")}</span></p>
        </section>
        ${leaderboard()}
      </div>
    </div>`;
}

// Last month's approved outlines per outliner, most first.
function leaderboard() {
  const m = monthOf(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1)));
  const rows = outliners().map(o => {
    const b = S.batches.find(x => x.application_id === o.id && x.month === m);
    return { o, approved: b?.status === "approved" ? b.approved : 0, rate: approvalRate(S.batches.filter(x => x.application_id === o.id)) };
  }).sort((a, b) => b.approved - a.approved);
  const top = Math.max(1, ...rows.map(r => r.approved));
  return `<section class="card"><header><h2>Outliners in ${monthLabel(m).split(" ")[0]}</h2><a class="small" href="#/outliners">All outliners</a></header>
    ${rows.length ? `<div class="pad"><table class="tbl lead"><thead><tr><th>Outliner</th><th>Approved outlines</th><th class="r">Approval</th></tr></thead><tbody>
      ${rows.map(r => `<tr class="click" onclick="location.hash='#/outliners/${r.o.id}'"><td><span class="person">${face(r.o.name)}<b>${esc(r.o.name)}</b></span></td>
        <td style="width:45%"><span class="row" style="display:flex;gap:10px;align-items:center"><span class="bar" style="flex:1"><i style="width:${r.approved / top * 100}%"></i></span><b class="num">${r.approved}</b></span></td>
        <td class="r num">${r.rate === null ? "–" : r.rate + "%"}</td></tr>`).join("")}</tbody></table></div>` : empty("No outliners yet", "Accept an application to build the team.")}</section>`;
}

// ============ Applications ============
let appFilter = "new", appQuery = "";
function applications(el, ctx, id) {
  const list = () => {
    const q = appQuery.toLowerCase();
    const rows = S.applications.filter(a => (appFilter === "all" || a.status === appFilter) && (!q || [a.name, a.email, ...a.genres].some(v => v.toLowerCase().includes(q))))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return rows.length ? rows.map(a => {
      const avg = average(S.scores.filter(s => s.application_id === a.id));
      return `<li><button type="button" data-open="${a.id}" aria-current="${a.id === id}">${face(a.name)}
        <span class="who"><b>${esc(a.name)}</b><small>${esc(a.email)} · ${day(a.created_at)}</small></span>
        <span class="end">${a.prior_ban ? pill("flag", "Banned before") : pill(a.status, APP_STATUS[a.status])}${avg === null ? "" : `<span class="score">${avg}<small> /25</small></span>`}</span></button></li>`;
    }).join("") : `<li>${empty("Nothing here", appQuery ? "No application matches that search." : `No ${APP_STATUS[appFilter]?.toLowerCase() ?? ""} applications yet.`)}</li>`;
  };
  const filters = [["new", "New"], ["review", "Reviewing"], ["accepted", "Accepted"], ["rejected", "Rejected"], ["banned", "Banned"], ["all", "All"]];
  el.innerHTML = `${head("Applications", "Every outliner who applied, with their assessment and both partners' scores.")}
    <div class="toolbar"><div class="seg" role="group" aria-label="Status">${filters.map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${k === appFilter}">${l}<b>${k === "all" ? S.applications.length : S.applications.filter(a => a.status === k).length}</b></button>`).join("")}</div>
      <label class="search">${ICON.search}<span class="sr">Search applications</span><input type="search" id="appSearch" value="${esc(appQuery)}" placeholder="Name, email or genre"></label></div>
    <div class="split${id ? " detail-open" : ""}"><section class="card list-card"><ul class="list" id="appList">${list()}</ul></section><section class="card detail" id="appDetail"></section></div>`;
  $$("[data-f]", el).forEach(b => b.onclick = () => { appFilter = b.dataset.f; ctx.rerender(); });
  $("#appSearch", el).oninput = e => { appQuery = e.target.value.trim(); $("#appList", el).innerHTML = list(); };
  $("#appList", el).onclick = e => { const b = e.target.closest("[data-open]"); if (b) ctx.go(`#/applications/${b.dataset.open}`); };
  appDetail($("#appDetail", el), ctx, byId("applications", id));
  if (id && matchMedia("(max-width: 900px)").matches) scrollTo(0, 0); // phones show the detail as its own screen
}

function appDetail(el, ctx, a) {
  if (!a) { el.innerHTML = empty("Pick an application", "Read the assessment, score it, then accept, reject or ban."); return; }
  const all = S.scores.filter(s => s.application_id === a.id), mine = all.find(s => s.reviewer === ctx.me) || {}, avg = average(all);
  const partner = all.find(s => s.reviewer !== ctx.me);
  el.innerHTML = `
    <a class="back" href="#/applications">‹ Applications</a>
    <div class="detail-head">${face(a.name, "lg")}<div class="meta"><h2>${esc(a.name)}</h2><p><a href="mailto:${esc(a.email)}">${esc(a.email)}</a> · applied ${since(a.created_at)}</p></div>
      ${pill(a.status, APP_STATUS[a.status] + (a.status === "accepted" ? ` · ${money(a.rate)}` : ""))}</div>
    ${a.prior_ban ? `<p class="warn">${ICON.flag}This email or name matches an outliner you banned before.</p>` : ""}
    <div class="decide" role="group" aria-label="Decision">
      <span class="decide-score">${avg === null ? "Not scored yet" : `<b>${avg}</b> / 25 team score`}</span>
      <label class="rate-in"><span class="sr">Rate per outline</span><i>$</i><input id="rate" type="number" min="0.5" max="5" step="0.05" value="${a.rate ?? ""}" placeholder="Rate"></label>
      <button type="button" class="dk-btn" data-set="accepted">Accept</button>
      <span class="more-acts">
        <button type="button" class="dk-btn ghost sm" data-set="review">Under review</button>
        <button type="button" class="dk-btn ghost sm" data-set="rejected">Reject</button>
        <button type="button" class="dk-btn danger sm" data-set="banned">Ban for AI</button>
      </span>
    </div>
    <dl class="facts">
      <div><dt>Book with 5,000+ views</dt><dd class="clip"><a href="${esc(a.book_link)}" target="_blank" rel="noopener noreferrer">${esc(a.book_link.replace(/^https?:\/\/(www\.)?/, ""))}</a></dd></div>
      <div><dt>Genres</dt><dd>${a.genres.length ? a.genres.map(esc).join(", ") : "None picked"}</dd></div>
      <div><dt>Declaration</dt><dd>100% human-written</dd></div>
    </dl>
    ${a.message ? `<p class="muted">“${esc(a.message)}”</p>` : ""}
    <h3 class="sec-title">Assessment ${a.file_path ? `<button type="button" class="dk-btn ghost sm" id="openFile">${ICON.file} Open attached document</button>` : ""}</h3>
    ${PARTS.some(([k]) => a[k]) ? `<div class="manuscript">${PARTS.filter(([k]) => a[k]).map(([k, l]) => `<section><h4>${l}</h4><p>${esc(a[k])}</p></section>`).join("")}</div>` : ""}
    <h3 class="sec-title">Score it <small>${mine.reviewer ? `You: ${total(mine)} / 25` : "1 is weak, 5 is excellent"}</small></h3>
    <form id="scoreForm" class="rubric">
      <div class="crit crit-head" aria-hidden="true"><span></span><span>Your score</span>${partner ? `<span>${esc(partner.reviewer.split("@")[0])}</span>` : ""}</div>
      ${CRITERIA.map(([k, l]) => `<div class="crit"><fieldset><legend>${l}</legend><div class="dots">${[1, 2, 3, 4, 5].map(n => `<label><input type="radio" name="${k}" value="${n}" required${mine[k] === n ? " checked" : ""}><span>${n}</span></label>`).join("")}</div></fieldset>${partner ? `<span class="theirs" title="${esc(partner.reviewer)}">${partner[k]}</span>` : ""}</div>`).join("")}
      ${partner?.note ? `<p class="partner-note"><b>${esc(partner.reviewer.split("@")[0])}:</b> “${esc(partner.note)}”</p>` : ""}
      <div class="fld"><label for="sNote">Note for your partner</label><textarea id="sNote" rows="2">${esc(mine.note)}</textarea></div>
      <div><button class="dk-btn">${mine.reviewer ? "Update my score" : "Save my score"}</button></div>
    </form>`;

  $("#openFile", el)?.addEventListener("click", () => openFile(ctx.db, "assessments", a.file_path).catch(fail));
  $("#scoreForm", el).onsubmit = async e => {
    e.preventDefault();
    const f = e.target, row = { application_id: a.id, note: $("#sNote", el).value.trim() || null, updated_at: new Date().toISOString() };
    for (const [k] of CRITERIA) { if (!f.elements[k].value) return toast("Score all five checks first.", true); row[k] = Number(f.elements[k].value); }
    const { error } = await ctx.db.from("scores").upsert(row, { onConflict: "application_id,reviewer" });
    if (error) return fail(error);
    S.scores = S.scores.filter(s => !(s.application_id === a.id && s.reviewer === ctx.me)).concat({ ...row, reviewer: ctx.me });
    toast("Score saved"); ctx.rerender();
  };
  $$("[data-set]", el).forEach(b => b.onclick = async () => {
    const status = b.dataset.set, change = { status };
    if (status === "accepted") {
      const rate = Number($("#rate", el).value);
      if (!(rate >= 0.5 && rate <= 5)) { $("#rate", el).focus(); return toast("Set a rate between $0.50 and $5.00 to accept.", true); }
      change.rate = rate;
    }
    if (status === "banned" && !await confirmBox(`Ban ${a.name}?`, "They're flagged if they apply again, and they lose access to the outliner portal.", "Ban")) return;
    try { await save(ctx.db, "applications", change, a.id); toast(status === "accepted" ? `${a.name} accepted. They can now sign in to the outliner portal.` : `${a.name}: ${APP_STATUS[status]}`); ctx.rerender(); }
    catch (err) { fail(err); }
  });
}

// ============ Outliners ============
function outlinerStats(o) {
  const mine = S.batches.filter(b => b.application_id === o.id);
  const approved = mine.filter(b => b.status === "approved");
  return { mine, approved: approved.reduce((n, b) => n + b.approved, 0), rate: approvalRate(mine), earned: approved.reduce((n, b) => n + payout(b.approved, b.rate), 0),
    last: mine.sort((a, b) => b.month.localeCompare(a.month))[0] };
}
function outliners_(el, ctx, id, sub) {
  const team = outliners(), waiting = S.batches.filter(b => b.status === "submitted").sort((a, b) => a.created_at.localeCompare(b.created_at));
  el.innerHTML = `${head("Outliners", `${plural(team.length, "outliner")} on the team. They submit monthly batches from the portal.`)}
    <div class="stack">
      <section class="card"><header><h2>Waiting for approval</h2><span class="muted small">${waiting.length || ""}</span></header>
        ${waiting.length ? `<div class="tbl-wrap"><table class="tbl stackable"><thead><tr><th>Outliner</th><th>Month</th><th class="r">Outlines</th><th>Sent</th><th></th></tr></thead><tbody>
          ${waiting.map(b => `<tr class="click" data-batch="${b.id}"><td><span class="person">${face(nameOf("applications", b.application_id))}<b>${esc(nameOf("applications", b.application_id))}</b></span></td><td>${monthLabel(b.month)}</td><td class="r num" data-l="Outlines">${b.submitted}</td><td class="muted" data-l="Sent">${day(b.created_at)}</td><td class="r"><button type="button" class="dk-btn sm">Review</button></td></tr>`).join("")}
          </tbody></table></div>` : `<div class="pad">${empty("No batches waiting", "New batches from the portal land here.")}</div>`}
      </section>
      ${team.length ? `<div class="people">${team.map(o => { const st = outlinerStats(o); return `
        <button type="button" class="card pcard" data-person="${o.id}"><span class="top">${face(o.name, "lg")}<span><h3>${esc(o.name)}</h3><small>${money(o.rate)} per outline</small></span></span>
          <dl><div><dt>Approved</dt><dd>${st.approved}</dd></div><div><dt>Approval</dt><dd>${st.rate === null ? "–" : st.rate + "%"}</dd></div><div><dt>Earned</dt><dd>${money(st.earned).replace(".00", "")}</dd></div></dl>
          <span class="foot"><span>${st.last ? `Last batch ${monthLabel(st.last.month)}` : "No batches yet"}</span>${st.last ? pill(st.last.status, st.last.status) : ""}</span></button>`; }).join("")}</div>`
      : `<section class="card">${empty("No outliners yet", "Accept an application and they appear here.")}</section>`}
    </div>`;
  $$("[data-batch]", el).forEach(r => r.onclick = () => ctx.go(`#/outliners/batch/${r.dataset.batch}`));
  $$("[data-person]", el).forEach(b => b.onclick = () => ctx.go(`#/outliners/${b.dataset.person}`));
  if (id === "batch" && byId("batches", sub)) reviewBatch(ctx, byId("batches", sub));
  else if (byId("applications", id)) outlinerDrawer(ctx, byId("applications", id));
}

function reviewBatch(ctx, b) {
  const o = byId("applications", b.application_id);
  drawer({
    title: `${o?.name ?? "Outliner"} · ${monthLabel(b.month)}`, sub: `${plural(b.submitted, "outline")} submitted ${day(b.created_at)}`,
    body: `${b.file_path ? `<button type="button" class="dk-btn ghost" id="batchFile">${ICON.file} Open their outlines</button>` : ""}${b.outliner_note ? `<div class="others"><p>“${esc(b.outliner_note)}”</p></div>` : ""}
      <p class="small muted">Approve the count that passed your checks. Returned batches go back to the outliner to fix and resubmit.</p>`,
    fields: [
      { k: "status", label: "Decision", type: "select", required: true, options: [["approved", "Approve"], ["returned", "Return to fix"]] },
      { k: "approved", label: "Outlines approved", type: "number", min: 0, max: b.submitted, required: true, hint: `of ${b.submitted}` },
      { k: "rate", label: "Rate per outline", type: "number", min: 0.5, max: 5, step: 0.05, required: true },
      { k: "team_note", label: "Note to the outliner", type: "textarea", rows: 3, full: true }],
    values: { status: b.status === "returned" ? "returned" : "approved", approved: b.approved || b.submitted, rate: b.rate ?? o?.rate, team_note: b.team_note },
    submit: "Save decision",
    onSubmit: async v => {
      if (v.status === "returned") v.approved = 0;
      await save(ctx.db, "batches", v, b.id);
      toast(v.status === "approved" ? `${v.approved} outlines approved · ${money(payout(v.approved, v.rate))} added to ${payWindow(b.month).label}` : "Returned to the outliner");
      ctx.go("#/outliners");
    },
  });
  $("#batchFile")?.addEventListener("click", () => openFile(ctx.db, "batches", b.file_path).catch(fail));
  closeOnDrawerExit(ctx, "#/outliners");
}

function outlinerDrawer(ctx, o) {
  const st = outlinerStats(o), stories = S.stories.filter(s => s.outliner_id === o.id);
  drawer({
    title: o.name, sub: `<a href="mailto:${esc(o.email)}">${esc(o.email)}</a> · on the team since ${day(o.created_at)}`,
    body: `<dl class="facts"><div><dt>Outlines approved</dt><dd>${st.approved}</dd></div><div><dt>Approval rate</dt><dd>${st.rate ?? "–"}${st.rate === null ? "" : "%"}</dd></div><div><dt>Earned to date</dt><dd>${money(st.earned)}</dd></div></dl>
      <div><h3 class="sec-title" style="margin-top:0">Batches</h3>${st.mine.length ? `<table class="tbl"><thead><tr><th>Month</th><th class="r">Sent</th><th class="r">Approved</th><th></th></tr></thead><tbody>${st.mine.map(b => `<tr class="click" data-b="${b.id}"><td>${monthLabel(b.month)}</td><td class="r num">${b.submitted}</td><td class="r num">${b.approved}</td><td class="r">${pill(b.status, b.status)}</td></tr>`).join("")}</tbody></table>` : `<p class="muted">No batches yet.</p>`}</div>
      ${stories.length ? `<div><h3 class="sec-title" style="margin-top:0">Stories from their outlines</h3>${stories.map(s => `<p><a href="#/stories/${s.id}">${esc(s.title)}</a> · ${STAGE[s.stage]}</p>`).join("")}</div>` : ""}`,
    fields: [{ k: "rate", label: "Rate per outline", type: "number", min: 0.5, max: 5, step: 0.05, required: true, hint: "applies to batches you approve from now" }],
    values: { rate: o.rate }, submit: "Save rate", danger: "Remove from team",
    onSubmit: async v => { await save(ctx.db, "applications", v, o.id); toast("Rate saved"); ctx.go("#/outliners"); },
    onDanger: async () => {
      if (!await confirmBox(`Remove ${o.name}?`, "They lose portal access. Their batches and pay history stay.", "Remove")) return;
      try { await save(ctx.db, "applications", { status: "rejected" }, o.id); toast(`${o.name} removed`); closeDrawer(); ctx.go("#/outliners"); } catch (err) { fail(err); }
    },
  });
  $$("[data-b]").forEach(r => r.onclick = () => ctx.go(`#/outliners/batch/${r.dataset.b}`));
  closeOnDrawerExit(ctx, "#/outliners");
}

// When a drawer opened from a URL closes, step the URL back so reopening works.
function closeOnDrawerExit(ctx, back) {
  const d = $(".drawer");
  d?.addEventListener("click", e => { if (e.target.closest("[data-close]")) history.replaceState(null, "", back); });
  d?.addEventListener("keydown", e => { if (e.key === "Escape") history.replaceState(null, "", back); });
}

// ============ Writers ============
function writers(el, ctx, id) {
  const owed = w => S.writer_logs.filter(l => l.writer_id === w.id && !l.paid).reduce((n, l) => n + payout(l.chapters, l.rate), 0);
  el.innerHTML = `${head("Writers", "The writers who turn approved outlines into chapters.",
    `<a class="dk-btn ghost" href="#/writers/log">${ICON.plus} Log chapters</a><a class="dk-btn" href="#/writers/new">${ICON.plus} Add writer</a>`)}
    ${S.writers.length ? `<div class="people">${S.writers.map(w => `
      <button type="button" class="card pcard" data-w="${w.id}"><span class="top">${face(w.name, "lg writer")}<span><h3>${esc(w.name)}</h3><small>${money(w.rate)} per chapter</small></span></span>
        <dl><div><dt>On stories</dt><dd>${S.stories.filter(s => s.writer_id === w.id && !["signed", "declined"].includes(s.stage)).length}</dd></div>
          <div><dt>Chapters</dt><dd>${S.writer_logs.filter(l => l.writer_id === w.id).reduce((n, l) => n + l.chapters, 0)}</dd></div>
          <div><dt>Owed</dt><dd>${money(owed(w)).replace(".00", "")}</dd></div></dl>
        <span class="foot"><span>${esc(w.email || "No email")}</span>${pill(w.status, w.status)}</span></button>`).join("")}</div>`
    : `<section class="card">${empty("No writers yet", "Add the writers who draft chapters from your outlines.")}</section>`}`;
  $$("[data-w]", el).forEach(b => b.onclick = () => ctx.go(`#/writers/${b.dataset.w}`));
  if (id === "new" || byId("writers", id)) writerDrawer(ctx, byId("writers", id));
  if (id === "log") logChapters(ctx);
}
function writerDrawer(ctx, w) {
  const logs = w ? S.writer_logs.filter(l => l.writer_id === w.id).sort((a, b) => b.month.localeCompare(a.month)) : [];
  drawer({
    title: w ? w.name : "Add a writer", sub: w ? `${plural(S.stories.filter(s => s.writer_id === w.id).length, "story", "stories")} assigned` : "",
    body: w && logs.length ? `<table class="tbl"><thead><tr><th>Month</th><th>Story</th><th class="r">Chapters</th><th class="r">Pay</th></tr></thead><tbody>${logs.map(l => `<tr><td>${monthLabel(l.month)}</td><td>${esc(byId("stories", l.story_id)?.title ?? "–")}</td><td class="r num">${l.chapters}</td><td class="r money">${money(payout(l.chapters, l.rate))}</td></tr>`).join("")}</tbody></table>` : "",
    fields: [
      { k: "name", label: "Name or pen name", required: true, full: true },
      { k: "email", label: "Email", type: "email" },
      { k: "rate", label: "Rate per chapter", type: "number", min: 0, step: 0.25, required: true },
      { k: "status", label: "Status", type: "select", required: true, options: [["active", "Active"], ["paused", "Paused"]] },
      { k: "notes", label: "Notes", type: "textarea", rows: 3, full: true }],
    values: w || { status: "active" }, submit: w ? "Save" : "Add writer", danger: w ? "Delete writer" : "",
    onSubmit: async v => { await save(ctx.db, "writers", v, w?.id); toast(w ? "Saved" : `${v.name} added`); ctx.go("#/writers"); },
    onDanger: async () => {
      if (!await confirmBox(`Delete ${w.name}?`, "Their chapter logs and pay history are deleted too. Pause them instead to keep the history.", "Delete")) return;
      try { await remove(ctx.db, "writers", w.id); S.writer_logs = S.writer_logs.filter(l => l.writer_id !== w.id); closeDrawer(); ctx.go("#/writers"); } catch (err) { fail(err); }
    },
  });
  closeOnDrawerExit(ctx, "#/writers");
}
function logChapters(ctx) {
  if (!S.writers.length) { toast("Add a writer first.", true); return ctx.go("#/writers/new"); }
  drawer({
    title: "Log chapters", sub: "Chapters a writer finished. They're paid on the 25th to 30th of the next month.",
    fields: [
      { k: "writer_id", label: "Writer", type: "select", required: true, options: S.writers.map(w => [w.id, `${w.name} · ${money(w.rate)}/chapter`]), full: true },
      { k: "story_id", label: "Story", type: "select", options: S.stories.map(s => [s.id, s.title]), full: true },
      { k: "month", label: "Month written", type: "month", required: true },
      { k: "chapters", label: "Chapters", type: "number", min: 1, required: true }],
    values: { month: monthOf(new Date()) }, submit: "Log chapters",
    onSubmit: async v => {
      v.rate = byId("writers", v.writer_id).rate;
      await save(ctx.db, "writer_logs", v);
      const s = byId("stories", v.story_id);
      if (s) await save(ctx.db, "stories", { chapters_done: s.chapters_done + v.chapters, updated_at: new Date().toISOString() }, s.id);
      toast(`${plural(v.chapters, "chapter")} logged · ${money(payout(v.chapters, v.rate))}`); ctx.go("#/writers");
    },
  });
  closeOnDrawerExit(ctx, "#/writers");
}

// ============ Story board ============
let storyLead = "all", storyQuery = "", storyStage = "outline";
function stories(el, ctx, id) {
  const shown = S.stories.filter(s => (storyLead === "all" || s.lead === storyLead) && (!storyQuery || `${s.title} ${s.trope}`.toLowerCase().includes(storyQuery.toLowerCase())));
  const card = s => {
    const d = daysUntil(s.due_on), live = !["signed", "declined"].includes(s.stage), o = byId("applications", s.outliner_id), w = byId("writers", s.writer_id);
    const pct = s.chapters_target ? Math.min(100, Math.round(s.chapters_done / s.chapters_target * 100)) : 0;
    return `<button type="button" class="scard ${s.lead}" draggable="true" data-s="${s.id}">
      <h4>${esc(s.title)}</h4>${s.trope ? `<span class="trope">${esc(s.trope)}</span>` : ""}
      ${s.chapters_target ? `<span class="row"><span>${s.chapters_done} / ${s.chapters_target} chapters</span><span>${pct}%</span></span><span class="bar"><i style="width:${pct}%"></i></span>` : ""}
      <span class="row"><span class="faces">${o ? face(o.name) : ""}${w ? face(w.name, "writer") : ""}</span>${s.due_on && live ? `<span class="due ${d < 0 ? "late" : d <= 7 ? "soon" : ""}">${d < 0 ? `${-d}d late` : d === 0 ? "due today" : `due ${day(s.due_on)}`}</span>` : ""}</span></button>`;
  };
  el.innerHTML = `${head("Story board", "Drag or tap a story to move it along. Coral spines are female lead, walnut are male lead.", `<a class="dk-btn" href="#/stories/new">${ICON.plus} New story</a>`)}
    <div class="toolbar"><div class="seg" role="group" aria-label="Lead">${[["all", "All"], ["f", "Female lead"], ["m", "Male lead"]].map(([k, l]) => `<button type="button" data-lead="${k}" aria-pressed="${k === storyLead}">${l}</button>`).join("")}</div>
      <label class="search">${ICON.search}<span class="sr">Search stories</span><input type="search" id="storySearch" value="${esc(storyQuery)}" placeholder="Title or trope"></label></div>
    <div class="stage-tabs" role="tablist" aria-label="Stage">${STAGES.map(([k, l]) => `<button type="button" role="tab" data-st="${k}" aria-selected="${k === storyStage}" style="--c: var(--st-${k})"><i></i>${l}<b>${shown.filter(s => s.stage === k).length}</b></button>`).join("")}</div>
    <div class="board">${STAGES.map(([k, l]) => { const cs = shown.filter(s => s.stage === k); return `
      <section class="col${k === storyStage ? " on" : ""}" data-stage="${k}" style="--c: var(--st-${k})"><header><i></i>${l}<b>${cs.length}</b></header>
        <div class="cards">${cs.map(card).join("")}</div>${k === "outline" ? `<button type="button" class="add-in-col" data-add>+ Add a story</button>` : ""}</section>`; }).join("")}</div>`;
  $$("[data-lead]", el).forEach(b => b.onclick = () => { storyLead = b.dataset.lead; ctx.rerender(); });
  $$("[data-st]", el).forEach(b => b.onclick = () => { storyStage = b.dataset.st; ctx.rerender(); });
  $("#storySearch", el).oninput = e => { storyQuery = e.target.value; ctx.rerender(); $("#storySearch").focus(); $("#storySearch").setSelectionRange(99, 99); };
  $("[data-add]", el).onclick = () => ctx.go("#/stories/new");
  $$(".scard", el).forEach(c => {
    c.onclick = () => ctx.go(`#/stories/${c.dataset.s}`);
    c.ondragstart = e => { e.dataTransfer.setData("text/plain", c.dataset.s); c.classList.add("dragging"); };
    c.ondragend = () => c.classList.remove("dragging");
  });
  $$(".col", el).forEach(col => {
    col.ondragover = e => { e.preventDefault(); col.classList.add("over"); };
    col.ondragleave = () => col.classList.remove("over");
    col.ondrop = async e => {
      e.preventDefault(); col.classList.remove("over");
      const s = byId("stories", e.dataTransfer.getData("text/plain")); if (!s || s.stage === col.dataset.stage) return;
      try { await save(ctx.db, "stories", { stage: col.dataset.stage, updated_at: new Date().toISOString() }, s.id); toast(`${s.title} → ${STAGE[col.dataset.stage]}`); ctx.rerender(); } catch (err) { fail(err); }
    };
  });
  if (id === "new" || byId("stories", id)) storyDrawer(ctx, byId("stories", id));
}
function storyDrawer(ctx, s) {
  const deals = s ? S.deals.filter(d => d.story_id === s.id) : [];
  drawer({
    title: s ? s.title : "New story", sub: s ? `Added ${day(s.created_at)} · ${STAGE[s.stage]}` : "Start from an approved outline.",
    body: deals.length ? `<div>${deals.map(d => `<p><a href="#/deals/${d.id}">${esc(nameOf("platforms", d.platform_id))}</a> · ${d.kind} · ${pill(d.status, d.status)}</p>`).join("")}</div>` : "",
    fields: [
      { k: "title", label: "Title", required: true, full: true },
      { k: "trope", label: "Trope or genre", placeholder: "Contract Marriage" },
      { k: "lead", label: "Lead", type: "select", required: true, options: [["f", "Female lead"], ["m", "Male lead"]] },
      { k: "stage", label: "Stage", type: "select", required: true, options: STAGES },
      { k: "due_on", label: "Due", type: "date" },
      { k: "outliner_id", label: "Outliner", type: "select", options: outliners().map(o => [o.id, o.name]) },
      { k: "writer_id", label: "Writer", type: "select", options: S.writers.map(w => [w.id, w.name]) },
      { k: "chapters_target", label: "Chapters planned", type: "number", min: 1 },
      { k: "chapters_done", label: "Chapters written", type: "number", min: 0, required: true },
      { k: "notes", label: "Notes", type: "textarea", rows: 4, full: true }],
    values: s || { lead: "f", stage: "outline", chapters_done: 0 }, submit: s ? "Save" : "Add story", danger: s ? "Delete story" : "",
    onSubmit: async v => { v.updated_at = new Date().toISOString(); await save(ctx.db, "stories", v, s?.id); toast(s ? "Saved" : `${v.title} added`); ctx.go("#/stories"); },
    onDanger: async () => {
      if (!await confirmBox(`Delete ${s.title}?`, "Its deals are deleted too. Move it to Declined instead to keep the record.", "Delete")) return;
      try { await remove(ctx.db, "stories", s.id); S.deals = S.deals.filter(d => d.story_id !== s.id); closeDrawer(); ctx.go("#/stories"); } catch (err) { fail(err); }
    },
  });
  closeOnDrawerExit(ctx, "#/stories");
}

// ============ Platform deals ============
let dealFilter = "all";
function deals(el, ctx, id) {
  const rows = S.deals.filter(d => dealFilter === "all" || d.status === dealFilter).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const sum = st => S.deals.filter(d => st.includes(d.status)).reduce((n, d) => n + Number(d.value || 0), 0);
  el.innerHTML = `${head("Platform deals", "What you've pitched, to whom, and what it's worth.",
    `<a class="dk-btn ghost" href="#/deals/platforms">Platforms</a><a class="dk-btn" href="#/deals/new">${ICON.plus} New deal</a>`)}
    <nav class="ledger three" aria-label="Deal totals">
      <a href="#/deals" data-df="signed"><b>${money(sum(["signed"])).replace(".00", "")}</b><span>Signed</span><small>${plural(S.deals.filter(d => d.status === "signed").length, "deal")}</small></a>
      <a href="#/deals" data-df="negotiating"><b>${money(sum(["pitched", "negotiating"])).replace(".00", "")}</b><span>In talks</span><small>${plural(S.deals.filter(d => ["pitched", "negotiating"].includes(d.status)).length, "deal")}</small></a>
      <a href="#/deals/platforms"><b>${S.platforms.length}</b><span>Platforms</span><small>${S.platforms.slice(0, 3).map(p => esc(p.name)).join(", ") || "add your first"}</small></a>
    </nav>
    <div class="toolbar"><div class="seg" role="group" aria-label="Status">${[["all", "All"], ["pitched", "Pitched"], ["negotiating", "Negotiating"], ["signed", "Signed"], ["declined", "Declined"]].map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${k === dealFilter}">${l}</button>`).join("")}</div></div>
    <section class="card">${rows.length ? `<div class="tbl-wrap"><table class="tbl stackable"><thead><tr><th>Story</th><th>Platform</th><th>Type</th><th class="r">Value</th><th>Status</th></tr></thead><tbody>
      ${rows.map(d => `<tr class="click" data-d="${d.id}"><td><b>${esc(byId("stories", d.story_id)?.title ?? "–")}</b></td><td>${esc(nameOf("platforms", d.platform_id))}</td><td>${d.kind === "buyout" ? "Buyout" : "Exclusive licence"}</td><td class="r money">${d.value == null ? "–" : money(d.value)}</td><td>${pill(d.status, d.status)}${d.signed_on ? ` <span class="muted small">${day(d.signed_on)}</span>` : ""}</td></tr>`).join("")}
      </tbody></table></div>` : empty("No deals yet", "Log a pitch as soon as you send it, and track it to signed.")}</section>`;
  $$("[data-f]", el).forEach(b => b.onclick = () => { dealFilter = b.dataset.f; ctx.rerender(); });
  $$("[data-d]", el).forEach(r => r.onclick = () => ctx.go(`#/deals/${r.dataset.d}`));
  if (id === "platforms") platformsDrawer(ctx);
  else if (id === "new" || byId("deals", id)) dealDrawer(ctx, byId("deals", id));
}
function dealDrawer(ctx, d) {
  if (!S.stories.length || !S.platforms.length) { toast(!S.stories.length ? "Add a story first." : "Add a platform first.", true); return ctx.go(!S.stories.length ? "#/stories/new" : "#/deals/platforms"); }
  drawer({
    title: d ? `${byId("stories", d.story_id)?.title} · ${nameOf("platforms", d.platform_id)}` : "New deal", sub: d ? `Logged ${day(d.created_at)}` : "One story, one platform.",
    fields: [
      { k: "story_id", label: "Story", type: "select", required: true, options: S.stories.map(s => [s.id, s.title]), full: true },
      { k: "platform_id", label: "Platform", type: "select", required: true, options: S.platforms.map(p => [p.id, p.name]) },
      { k: "kind", label: "Type", type: "select", required: true, options: [["licence", "Exclusive licence"], ["buyout", "Buyout"]] },
      { k: "value", label: "Value (USD)", type: "number", min: 0, step: 1 },
      { k: "status", label: "Status", type: "select", required: true, options: [["pitched", "Pitched"], ["negotiating", "Negotiating"], ["signed", "Signed"], ["declined", "Declined"]] },
      { k: "signed_on", label: "Signed on", type: "date" },
      { k: "notes", label: "Notes", type: "textarea", rows: 3, full: true }],
    values: d || { kind: "licence", status: "pitched" }, submit: d ? "Save" : "Add deal", danger: d ? "Delete deal" : "",
    onSubmit: async v => {
      if (v.status === "signed" && !v.signed_on) v.signed_on = today();
      await save(ctx.db, "deals", v, d?.id);
      const s = byId("stories", v.story_id), next = { signed: "signed", pitched: "pitched", negotiating: "pitched" }[v.status];
      if (s && next && s.stage !== next && !(s.stage === "signed")) await save(ctx.db, "stories", { stage: next, updated_at: new Date().toISOString() }, s.id);
      toast(v.status === "signed" ? `Signed · ${s?.title} moved to Signed` : "Deal saved"); ctx.go("#/deals");
    },
    onDanger: async () => {
      if (!await confirmBox("Delete this deal?", "This can't be undone.", "Delete")) return;
      try { await remove(ctx.db, "deals", d.id); closeDrawer(); ctx.go("#/deals"); } catch (err) { fail(err); }
    },
  });
  closeOnDrawerExit(ctx, "#/deals");
}
function platformsDrawer(ctx) {
  drawer({
    title: "Platforms", sub: "The platforms you pitch to.",
    body: S.platforms.length ? `<table class="tbl"><tbody>${S.platforms.map(p => `<tr><td><b>${esc(p.name)}</b>${p.contact ? `<br><span class="muted small">${esc(p.contact)}</span>` : ""}</td><td class="r">${S.deals.filter(d => d.platform_id === p.id).length} deals</td><td class="r"><button type="button" class="dk-btn danger-text sm" data-rm="${p.id}">Remove</button></td></tr>`).join("")}</tbody></table>` : "",
    fields: [{ k: "name", label: "Add a platform", required: true, placeholder: "GoodNovel" }, { k: "contact", label: "Contact", placeholder: "Acquisitions editor, email" }, { k: "website", label: "Website", type: "url", placeholder: "https://", full: true }],
    submit: "Add platform",
    onSubmit: async v => { await save(ctx.db, "platforms", v); toast(`${v.name} added`); ctx.go("#/deals/platforms"); },
  });
  $$("[data-rm]").forEach(b => b.onclick = async () => {
    try { await remove(ctx.db, "platforms", b.dataset.rm); toast("Removed"); ctx.go("#/deals/platforms"); } catch (err) { fail(err); }
  });
  closeOnDrawerExit(ctx, "#/deals");
}

// ============ Payroll ============
function payroll_(el, ctx) {
  const windows = pay().reverse(), owed = windows.reduce((n, w) => n + w.owed, 0);
  const upcoming = windows.filter(w => w.owed > 0).reverse(), cleared = windows.filter(w => w.owed === 0);
  const win = w => `<section class="card paywin${w.owed ? "" : " cleared"}"><header><h2>${w.label}</h2><div class="sum">${w.owed ? `<span>owed</span><b>${money(w.owed)}</b>` : ""}<span>paid ${money(w.paid)}</span>
      ${w.owed ? `<button type="button" class="dk-btn sm" data-all="${w.key}">Mark all paid</button>` : pill("paid", "Cleared")}</div></header>
    <div class="tbl-wrap"><table class="tbl stackable payrows"><tbody>${w.lines.map(l => `<tr><td><span class="person">${face(l.who, l.kind === "writer" ? "writer" : "")}<span><b>${esc(l.who)}</b><small>${l.kind === "writer" ? "Writer" : "Outliner"} · ${monthLabel(l.month)}</small></span></span></td>
      <td class="muted">${esc(l.detail)}</td><td class="r money">${money(l.amount)}</td>
      <td class="r"><label class="pill ${l.paid ? "paid" : "owed"} plain" style="cursor:pointer"><input type="checkbox" data-pay="${l.table}:${l.id}"${l.paid ? " checked" : ""} style="width:15px;height:15px"> ${l.paid ? "Paid" : "Mark paid"}</label></td></tr>`).join("")}</tbody></table></div></section>`;
  el.innerHTML = `${head("Payroll", `Work from each month is paid on the 25th to 30th of the next. ${owed ? `<b>${money(owed)}</b> owed in all.` : "Nothing owed right now."}`)}
    ${windows.length ? upcoming.map(win).join("") + (cleared.length ? `<h3 class="sec-title">Paid</h3>${cleared.map(win).join("")}` : "") : `<section class="card">${empty("No pay yet", "Approved outliner batches and logged writer chapters show up here.")}</section>`}`;
  const mark = async (table, id, paid) => save(ctx.db, table, { paid, paid_on: paid ? today() : null }, id);
  $$("[data-pay]", el).forEach(c => c.onchange = async () => {
    const [table, id] = c.dataset.pay.split(":");
    try { await mark(table, id, c.checked); toast(c.checked ? "Marked paid" : "Marked unpaid"); ctx.rerender(); } catch (err) { c.checked = !c.checked; fail(err); }
  });
  $$("[data-all]", el).forEach(b => b.onclick = async () => {
    const w = windows.find(x => x.key === b.dataset.all), due = w.lines.filter(l => !l.paid);
    if (!await confirmBox(`Mark ${w.label} paid?`, `${plural(due.length, "payment")} totalling ${money(w.owed)}. Only do this once the money has gone out.`, "Mark paid")) return;
    try { for (const l of due) await mark(l.table, l.id, true); toast(`${w.label} marked paid`); ctx.rerender(); } catch (err) { fail(err); ctx.rerender(); }
  });
}

// ============ Team ============
// Invitation = add the email to admins, then email them a one-time sign-in link to the desk.
function team(el, ctx) {
  const people = [...S.admins].sort((a, b) => (a.email === ctx.me ? -1 : b.email === ctx.me ? 1 : a.added_at.localeCompare(b.added_at)));
  el.innerHTML = `${head("Team", "Everyone who can sign in to the desk.")}
    <div class="grid-2">
      <section class="card"><header><h2>Desk members</h2><span class="count">${people.length}</span></header>
        <ul class="todo">${people.map(a => `<li><div class="member">${face(a.email.split("@")[0])}<span class="what"><b>${esc(a.email)}</b><small>${a.email === ctx.me ? "You" : `added ${since(a.added_at)}`}</small></span>
          ${a.email === ctx.me ? "" : `<button type="button" class="dk-btn ghost sm" data-rm="${esc(a.email)}">Remove</button>`}</div></li>`).join("")}</ul></section>
      <section class="card"><header><h2>Invite a partner</h2></header>
        <form id="invite" class="dk-form pad" novalidate style="padding-top:16px">
          <div class="fld full"><label for="invEmail">Their email</label><input id="invEmail" type="email" autocomplete="off" required placeholder="name@example.com"></div>
          <div class="fld full"><button class="dk-btn" style="justify-self:start">Send invitation</button></div>
          <p class="small muted" style="grid-column:1/-1;margin:0">They get an email with a link to create their password, then sign in with email and password. They can see and change everything you can.</p>
        </form></section>
    </div>`;
  $("#invite", el).onsubmit = async e => {
    e.preventDefault();
    const input = $("#invEmail", el), email = input.value.trim().toLowerCase();
    if (!input.checkValidity() || !email) { input.focus(); return toast("Enter a valid email.", true); }
    if (S.admins.some(a => a.email === email)) return toast(`${email} is already on the team.`, true);
    const btn = e.target.querySelector("button"); btn.disabled = true;
    try {
      const { data, error } = await ctx.db.from("admins").insert({ email }).select().single();
      if (error) throw error;
      S.admins.push(data);
      const link = await ctx.db.auth.signInWithOtp({ email, options: { emailRedirectTo: linkBack() } }); // lands on "Create your password"
      toast(link.error ? `${email} added. The email didn't send (${link.error.message}); they can request a sign-in link from the desk.` : `Invitation sent to ${email}.`, !!link.error);
      ctx.rerender();
    } catch (err) { fail(err); } finally { btn.disabled = false; }
  };
  $$("[data-rm]", el).forEach(b => b.onclick = async () => {
    const email = b.dataset.rm;
    if (!await confirmBox(`Remove ${email}?`, "They lose access to the desk straight away. You can invite them again later.", "Remove")) return;
    const { error } = await ctx.db.from("admins").delete().eq("email", email);
    if (error) return fail(error);
    S.admins = S.admins.filter(a => a.email !== email); toast(`${email} removed`); ctx.rerender();
  });
}

export const VIEWS = { overview, applications, outliners: outliners_, writers, stories, deals, payroll: payroll_, team };
