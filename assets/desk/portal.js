// Outliner portal: sign in with an emailed link, submit a monthly batch, see approvals and pay.
// The database only shows an outliner their own record and batches, and won't let them approve or price anything.
import { $, esc, day, connect, toast, explain, ICON, plural } from "./core.js";
import { money, payout, monthOf, monthLabel, payWindow, approvalRate } from "./calc.js";

const root = $("#root"), db = connect();
const STATUS = { submitted: "With our editors", approved: "Approved", returned: "Returned to fix" };
let me, batches = [];

function gate(message = "") {
  root.innerHTML = `<div class="gate">
    <div class="gate-side"><a class="brand" href="outliners.html">dram<i>reads</i><small>outliner portal</small></a>
      <div><blockquote>Send your outlines. Track every approval.</blockquote><p>For accepted dramreads outliners. Sign in with the email you applied with.</p></div></div>
    <div class="gate-form"><form id="login" novalidate>
      <h1>Sign in</h1>
      <p class="muted" style="margin:0">We'll email you a link. No password needed.</p>
      <div class="fld"><label for="lEmail">Email you applied with</label><input id="lEmail" type="email" autocomplete="email" required></div>
      <button class="dk-btn">Email me a sign-in link</button>
      <p class="err" id="loginErr" role="status">${esc(message)}</p>
      <p class="muted small">Not on the team yet? <a href="outliners.html#apply">Apply to outline</a>.</p>
    </form></div></div>`;
  $("#login").onsubmit = async e => {
    e.preventDefault();
    const email = $("#lEmail").value.trim(), out = $("#loginErr");
    if (!$("#lEmail").checkValidity() || !email) return out.textContent = "Enter the email you applied with.";
    if (!db) return;
    const btn = e.target.querySelector("button"); btn.disabled = true;
    const { error } = await db.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
    btn.disabled = false;
    out.textContent = error ? explain(error) : `Check ${email} for your sign-in link. It works once, for an hour.`;
  };
}

async function start(session) {
  const email = session.user.email.toLowerCase();
  const { data, error } = await db.from("applications").select("id, name, email, rate, created_at").eq("email", email).eq("status", "accepted");
  if (error) return gate(explain(error));
  if (!data.length) { await db.auth.signOut(); return gate(`${email} isn't on the outliner team. Use the email you applied with, or wait for your acceptance.`); }
  me = data[0];
  const b = await db.from("batches").select("*").eq("application_id", me.id).order("month", { ascending: false });
  if (b.error) return gate(explain(b.error));
  batches = b.data;
  render();
}

function render() {
  const approved = batches.filter(b => b.status === "approved");
  const earned = approved.reduce((n, b) => n + payout(b.approved, b.rate), 0);
  const unpaid = approved.filter(b => !b.paid).sort((a, b) => a.month.localeCompare(b.month));
  const next = unpaid[0] && payWindow(unpaid[0].month);
  const nextSum = next ? unpaid.filter(b => payWindow(b.month).key === next.key).reduce((n, b) => n + payout(b.approved, b.rate), 0) : 0;
  const rate = approvalRate(batches), first = me.name.split(" ")[0];
  root.innerHTML = `<div class="portal">
    <header class="portal-top"><a class="brand" href="outliners.html">dram<i>reads</i></a><button type="button" class="dk-btn ghost sm" id="signOut">${ICON.out} Sign out</button></header>
    <div class="hello">
      <section class="card"><h1>Hi ${esc(first)}.</h1><p>${next ? `Your next payday is <b>${next.label}</b>: ${money(nextSum)} for approved outlines.` : batches.length ? "Nothing waiting to be paid right now." : "Send your first monthly batch below."}</p>
        <p class="rule">${ICON.flag}<span><b>Human-written only.</b> Any trace of AI in a batch ends the partnership and forfeits unpaid earnings.</span></p></section>
      <section class="card rate-card"><div><small>Your rate</small><br><b>${money(me.rate)}</b> <small>per approved outline</small></div>
        <div style="display:flex;gap:28px"><div><small>Approval rate</small><br><b style="font-size:28px">${rate === null ? "–" : rate + "%"}</b></div><div><small>Earned so far</small><br><b style="font-size:28px">${money(earned).replace(".00", "")}</b></div></div></section>
    </div>
    <section class="card" style="margin-bottom:18px"><header><h2>Send this month's batch</h2></header>
      <form id="batchForm" class="dk-form pad" novalidate>
        <div class="fld"><label for="bMonth">Month</label><input id="bMonth" type="month" required value="${monthOf(new Date()).slice(0, 7)}"></div>
        <div class="fld"><label for="bCount">Chapter outlines in this batch <small>50 to 200</small></label><input id="bCount" type="number" min="1" max="1000" required></div>
        <div class="fld full"><label for="bFile">Your outlines <small>PDF, Word or text, up to 25 MB</small></label><input id="bFile" type="file" required accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"></div>
        <div class="fld full"><label for="bNote">Note for the editors <small>optional</small></label><textarea id="bNote" rows="2" maxlength="2000"></textarea></div>
        <div class="fld full"><button class="dk-btn" style="justify-self:start">Send batch</button></div>
      </form></section>
    <section class="card"><header><h2>Your batches</h2><span class="muted small">${plural(batches.length, "batch", "batches")}</span></header>
      ${batches.length ? `<div class="tbl-wrap"><table class="tbl stackable"><thead><tr><th>Month</th><th class="r">Sent</th><th class="r">Approved</th><th>Status</th><th class="r">Pay</th><th>Paid on</th></tr></thead><tbody>
        ${batches.map(b => `<tr><td><b>${monthLabel(b.month)}</b>${b.team_note ? `<br><span class="small muted">Editor: “${esc(b.team_note)}”</span>` : ""}</td><td class="r num">${b.submitted}</td><td class="r num">${b.status === "approved" ? b.approved : "–"}</td>
          <td><span class="pill ${b.status}">${STATUS[b.status]}</span></td><td class="r money">${b.status === "approved" ? money(payout(b.approved, b.rate)) : "–"}</td>
          <td class="small">${b.paid ? `Paid ${day(b.paid_on)}` : b.status === "approved" ? payWindow(b.month).label : ""}</td></tr>`).join("")}
      </tbody></table></div>` : `<div class="empty"><b>No batches yet</b>Your monthly batches and their approvals show up here.</div>`}</section>
  </div>`;
  $("#signOut").onclick = async () => { await db.auth.signOut(); gate("You're signed out."); };
  $("#batchForm").onsubmit = submit;
}

async function submit(e) {
  e.preventDefault();
  const f = e.target, month = `${$("#bMonth").value}-01`, count = Number($("#bCount").value), file = $("#bFile").files[0];
  const bad = [...f.querySelectorAll("input")].find(i => !i.checkValidity());
  if (bad) { bad.focus(); return toast(bad.id === "bFile" ? "Attach your outlines." : bad.id === "bCount" ? "Enter how many chapter outlines are in the batch." : "Pick the month.", true); }
  if (file.size > 26214400) return toast("That file is over 25 MB. Split it or compress it.", true);
  const existing = batches.find(b => b.month === month);
  if (existing?.status === "approved") return toast(`${monthLabel(month)} is already approved. Pick another month.`, true);
  const btn = f.querySelector("button"); btn.disabled = true; btn.textContent = "Sending…";
  try {
    const path = `${me.id}/${month.slice(0, 7)}-${crypto.randomUUID().slice(0, 8)}-${file.name.replace(/[^\w.-]+/g, "_").slice(-60)}`;
    const up = await db.storage.from("batches").upload(path, file, { contentType: file.type || "application/octet-stream" });
    if (up.error) throw up.error;
    const row = { application_id: me.id, month, submitted: count, file_path: path, outliner_note: $("#bNote").value.trim() || null };
    const q = existing ? db.from("batches").update(row).eq("id", existing.id) : db.from("batches").insert(row);
    const { data, error } = await q.select().single();
    if (error) throw error;
    batches = [data, ...batches.filter(b => b.id !== data.id)].sort((a, b) => b.month.localeCompare(a.month));
    render(); toast(`${monthLabel(month)} sent: ${plural(count, "outline")}. Our editors will review it.`);
  } catch (err) { console.error(err); toast(explain(err), true); btn.disabled = false; btn.textContent = "Send batch"; }
}

if (!db) gate("The portal isn't connected yet.");
else {
  const { data } = await db.auth.getSession();
  data.session ? start(data.session) : gate();
  db.auth.onAuthStateChange((ev, session) => { if (ev === "SIGNED_IN" && session && !me) start(session); });
}
