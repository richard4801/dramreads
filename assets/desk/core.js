// Shared by the desk and the outliner portal: data access, formatting and the drawer/toast/confirm UI.
// What anyone can read or change is enforced by supabase/schema.sql; this file only reflects it.

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const day = d => d ? new Date(d.length === 10 ? d + "T00:00:00Z" : d).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";
export const initials = n => String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
export const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;

// ---------- Connection ----------
export function connect() {
  const cfg = window.DR_SUPABASE;
  if (!cfg?.url || !window.supabase) return null;
  return window.supabase.createClient(cfg.url, cfg.anonKey);
}

// ---------- Store: every table the signed-in person can see, kept in memory ----------
export const TABLES = ["applications", "scores", "batches", "writers", "writer_logs", "platforms", "stories", "deals"];
export const S = Object.fromEntries(TABLES.map(t => [t, []]));
export const byId = (table, id) => S[table].find(r => r.id === id);

export async function loadAll(db, tables = TABLES) {
  const res = await Promise.all(tables.map(t => db.from(t).select("*")));
  const bad = res.find(r => r.error);
  if (bad) throw bad.error;
  tables.forEach((t, i) => S[t] = res[i].data);
}

// Insert (no id) or update (id) one row, keep the store in step, and return the saved row.
export async function save(db, table, values, id) {
  const q = id ? db.from(table).update(values).eq("id", id) : db.from(table).insert(values);
  const { data, error } = await q.select().single();
  if (error) throw error;
  const i = S[table].findIndex(r => r.id === data.id);
  i >= 0 ? (S[table][i] = data) : S[table].push(data);
  return data;
}

export async function remove(db, table, id) {
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) throw error;
  S[table] = S[table].filter(r => r.id !== id);
}

export async function openFile(db, bucket, path) {
  const { data, error } = await db.storage.from(bucket).createSignedUrl(path, 600);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener");
}

// Plain-language messages for the database errors people can actually cause.
export function explain(error) {
  if (error?.code === "23505") return "That already exists. Edit the existing one instead.";
  if (error?.code === "23503") return "Something else still uses this, so it can't be removed.";
  if (error?.code === "23514") return "One of the values is outside what's allowed. Check the numbers and dates.";
  return error?.message || "Something went wrong. Try again.";
}

// ---------- Toast ----------
let toastTimer;
export function toast(msg, isError) {
  let t = $("#toast");
  if (!t) { t = Object.assign(document.createElement("p"), { id: "toast", role: "status" }); document.body.append(t); }
  t.textContent = msg; t.className = isError ? "err show" : "show";
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.className = isError ? "err" : "", isError ? 6000 : 2600);
}

// ---------- Confirm ----------
export function confirmBox(title, body, yes = "Confirm") {
  return new Promise(done => {
    const d = document.createElement("dialog");
    d.className = "confirm";
    d.innerHTML = `<h3>${esc(title)}</h3><p>${esc(body)}</p><div class="row"><button class="dk-btn ghost" value="no">Cancel</button><button class="dk-btn danger" value="yes">${esc(yes)}</button></div>`;
    document.body.append(d);
    d.addEventListener("click", e => { if (e.target.value) d.close(e.target.value); });
    d.addEventListener("close", () => { done(d.returnValue === "yes"); d.remove(); });
    d.showModal();
  });
}

// ---------- Drawer with a form built from a field list ----------
// field: { k, label, type: text|email|url|number|date|month|select|textarea|checkbox, options: [[value,label]], required, min, max, step, hint, full }
const input = (f, v) => {
  const a = `id="f_${f.k}" name="${f.k}"${f.required ? " required" : ""}${f.min != null ? ` min="${f.min}"` : ""}${f.max != null ? ` max="${f.max}"` : ""}${f.step ? ` step="${f.step}"` : ""}${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ""}`;
  if (f.type === "textarea") return `<textarea ${a} rows="${f.rows || 4}">${esc(v)}</textarea>`;
  if (f.type === "select") return `<select ${a}>${f.required ? "" : '<option value="">None</option>'}${f.options.map(([val, l]) => `<option value="${esc(val)}"${String(v ?? "") === String(val) ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
  if (f.type === "checkbox") return `<input type="checkbox" ${a}${v ? " checked" : ""}>`;
  const val = f.type === "month" && v ? String(v).slice(0, 7) : v;
  return `<input type="${f.type || "text"}" ${a} value="${esc(val)}">`;
};

export function drawer({ title, sub = "", fields = [], values = {}, body = "", submit, onSubmit, danger, onDanger }) {
  $$(".drawer").forEach(d => d.remove());
  const el = document.createElement("aside");
  el.className = "drawer"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "drawerTitle");
  el.innerHTML = `<div class="drawer-scrim" data-close></div><div class="drawer-panel">
    <header><div><h2 id="drawerTitle">${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ""}</div><button type="button" class="dk-icon" data-close aria-label="Close">${ICON.x}</button></header>
    <div class="drawer-body">${body}
      ${fields.length ? `<form id="drawerForm" class="dk-form" novalidate>${fields.map(f => `<div class="fld${f.full ? " full" : ""}${f.type === "checkbox" ? " check" : ""}"><label for="f_${f.k}">${esc(f.label)}${f.hint ? `<small>${esc(f.hint)}</small>` : ""}</label>${input(f, values[f.k])}</div>`).join("")}</form>` : ""}
    </div>
    ${submit || danger ? `<footer>${danger ? `<button type="button" class="dk-btn danger-text" id="drawerDanger">${esc(danger)}</button>` : "<span></span>"}${submit ? `<button type="submit" form="drawerForm" class="dk-btn">${esc(submit)}</button>` : ""}</footer>` : ""}
  </div>`;
  document.body.append(el);
  document.body.classList.add("drawer-open");
  requestAnimationFrame(() => el.classList.add("open"));
  el.addEventListener("click", e => { if (e.target.closest("[data-close]")) closeDrawer(el); });
  el.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(el); });
  const form = $("#drawerForm", el);
  form?.addEventListener("submit", async e => {
    e.preventDefault();
    const bad = $$("input,select,textarea", form).find(i => !i.checkValidity());
    if (bad) { bad.focus(); bad.reportValidity(); return; }
    const out = {};
    fields.forEach(f => {
      const i = form.elements[f.k];
      let v = f.type === "checkbox" ? i.checked : i.value.trim();
      if (f.type === "number") v = v === "" ? null : Number(v);
      else if (f.type === "month") v = v ? `${v}-01` : null;
      else if (v === "" && f.type !== "checkbox") v = null;
      out[f.k] = v;
    });
    const btn = $('footer [type="submit"]', el); btn.disabled = true;
    try { await onSubmit(out); closeDrawer(el); }
    catch (err) { console.error(err); toast(explain(err), true); }
    finally { btn.disabled = false; }
  });
  $("#drawerDanger", el)?.addEventListener("click", onDanger);
  ($("input,select,textarea", el) || $("[data-close].dk-icon", el)).focus();
  return el;
}
// Closes one drawer (default: the open one). A newer drawer that replaced it stays open.
export function closeDrawer(el = $(".drawer.open")) {
  if (!el) return;
  el.classList.remove("open");
  if (!$(".drawer.open")) document.body.classList.remove("drawer-open");
  setTimeout(() => el.remove(), 220);
}

// ---------- Icons (24px stroke) ----------
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICON = {
  overview: svg('<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 4v3h6V4z"/>'),
  applications: svg('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/>'),
  outliners: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.7.8 2.8 2.5 3 5.2"/>'),
  writers: svg('<path d="M16.5 3.5l4 4L8 20H4v-4z"/><path d="M14 6l4 4"/>'),
  stories: svg('<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H11v18H5.5A1.5 1.5 0 0 1 4 19.5z"/><path d="M11 3h7.5A1.5 1.5 0 0 1 20 4.5v15a1.5 1.5 0 0 1-1.5 1.5H11"/><path d="M7 7h1M14.5 7h2.5"/>'),
  deals: svg('<path d="M3 11l4-4 4 2 3-3 7 7-4 4-3-1-3 3-4-4z"/><path d="M10 13l3 3"/>'),
  payroll: svg('<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  file: svg('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>'),
  out: svg('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>'),
  flag: svg('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
};
