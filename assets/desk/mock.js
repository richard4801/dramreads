// Demo mode: an in-memory stand-in for Supabase with sample data, so the desk and portal can be tried
// without an account. Nothing is saved; a refresh starts over. Used only by *-preview.html.
const uuid = () => crypto.randomUUID();
const now = new Date();
const ago = days => new Date(now - days * 864e5).toISOString();
const inDays = days => new Date(+now + days * 864e5).toISOString().slice(0, 10);
const month = offset => { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)); return d.toISOString().slice(0, 10); };

function seed() {
  const app = (name, status, days, extra = {}) => ({ id: uuid(), created_at: ago(days), name, email: name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "") + "@example.com",
    book_link: "https://www.goodnovel.com/book/sample", genres: ["Contract Marriage", "Mafia & Biker"], message: null,
    blurb: "She signed the contract to save her father's company. He signed it to destroy hers.",
    story_outline: "Act one: the wedding is a business deal, and Ivy plans to leave the day the debt clears.\nAct two: the deal starts to cost them both: a rival family, a leaked prenup, a night neither planned.\nAct three: the betrayal, the choice, and a vow that isn't on paper.",
    characters: "Ivy Hart, 24: proud, broke, sharper than anyone expects.\nDante Moretti, 31: heir to a shipping empire with a debt to settle and no patience for love.",
    chapter_1: "Ivy walks into the wrong boardroom, and the wrong man offers her a ring.", chapter_2: "The prenup has one clause she can't read, and he won't translate it.",
    chapter_3: "Their first public kiss is staged for the cameras. Her reaction isn't.", file_path: null, human_declared: true, status, rate: null, prior_ban: false, ...extra });
  const applications = [
    app("Ama Okafor", "new", 0), app("Lena Brooks", "new", 1, { file_path: "x/assessment.pdf", blurb: null, story_outline: null, characters: null, chapter_1: null, chapter_2: null, chapter_3: null, genres: ["Sports Romance"] }),
    app("R. Vale", "new", 2, { prior_ban: true }), app("Daniel Osei", "review", 6, { genres: ["Urban Son-in-Law", "Demon"] }),
    app("Grace Lin", "accepted", 120, { rate: 2.5 }), app("Marcus Reed", "accepted", 95, { rate: 0.75 }), app("Tobi Adeyemi", "accepted", 60, { rate: 1.5 }), app("Amara Obi", "accepted", 40, { rate: 3 }),
    app("Sam Whitfield", "rejected", 30), app("Rachel Vale", "banned", 80),
  ];
  const A = Object.fromEntries(applications.map(a => [a.name.split(" ")[0], a]));
  const scores = [
    { application_id: A.Daniel.id, reviewer: "partner@dramreads.test", no_ai: 5, originality: 4, creativity: 4, market_fit: 5, storyline: 4, note: "Strong hooks. Chapter 3 drags.", updated_at: ago(4) },
    { application_id: A.Ama.id, reviewer: "partner@dramreads.test", no_ai: 5, originality: 5, creativity: 4, market_fit: 4, storyline: 5, note: "Best blurb this month.", updated_at: ago(0) }];
  const batch = (a, m, submitted, approved, status, paid, extra = {}) => ({ id: uuid(), created_at: ago(-m * 30 + 3), application_id: a.id, month: month(m), submitted, approved, rate: status === "approved" ? a.rate : null, status, file_path: "x/batch.pdf", outliner_note: null, team_note: null, paid, paid_on: paid ? inDays(m * 30) : null, ...extra });
  const batches = [
    batch(A.Grace, -3, 120, 112, "approved", true), batch(A.Grace, -2, 150, 141, "approved", true), batch(A.Grace, -1, 160, 150, "approved", false), batch(A.Grace, 0, 140, 0, "submitted", false, { outliner_note: "Includes the full Mafia arc for The Don's Debt." }),
    batch(A.Marcus, -2, 80, 52, "approved", true), batch(A.Marcus, -1, 90, 70, "approved", false), batch(A.Marcus, 0, 60, 0, "returned", false, { team_note: "Chapters 12 to 20 repeat the same beat. Tighten and resend." }),
    batch(A.Tobi, -1, 100, 90, "approved", false), batch(A.Tobi, 0, 110, 0, "submitted", false),
    batch(A.Amara, -1, 60, 58, "approved", false)];
  const writers = [
    { id: uuid(), created_at: ago(200), name: "Wren Hale", email: "wren@example.com", rate: 4, status: "active", notes: "Fast on romance, slower on fantasy." },
    { id: uuid(), created_at: ago(150), name: "Kemi Adebayo", email: "kemi@example.com", rate: 3.5, status: "active", notes: null },
    { id: uuid(), created_at: ago(90), name: "Jonah Park", email: "jonah@example.com", rate: 5, status: "paused", notes: "Back in January." }];
  const [wren, kemi, jonah] = writers;
  const platforms = ["GoodNovel", "Webnovel", "Dreame", "NovelSnack"].map(name => ({ id: uuid(), name, website: null, contact: name === "GoodNovel" ? "Acquisitions team" : null, notes: null }));
  const [goodnovel, webnovel, dreame, novelsnack] = platforms;
  const story = (title, trope, lead, stage, o, w, target, done, due, days) => ({ id: uuid(), created_at: ago(days), updated_at: ago(days / 2), title, trope, lead, stage, outliner_id: o?.id ?? null, writer_id: w?.id ?? null, chapters_target: target, chapters_done: done, due_on: due, notes: null });
  const stories = [
    story("The Don's Debt", "Mafia", "f", "outline", A.Grace, null, 120, 0, inDays(30), 3),
    story("Rebirth of the Discarded Heiress", "Rebirth", "f", "outline", A.Amara, null, 100, 0, null, 2),
    story("Mountain Lord Descends", "Mountain Descent", "m", "outline", A.Tobi, null, 200, 0, inDays(45), 5),
    story("Second Chance Season", "Second Chance", "f", "writing", A.Grace, wren, 110, 64, inDays(12), 50),
    story("Offside Hearts", "Sports Romance", "f", "writing", A.Marcus, kemi, 90, 30, inDays(-4), 60),
    story("The Son-in-Law Returns", "Urban Son-in-Law", "m", "writing", A.Tobi, jonah, 180, 41, inDays(20), 40),
    story("Ash & Ember", "Dragon Fantasy", "f", "editing", A.Grace, wren, 120, 120, inDays(3), 80),
    story("Bride Swap", "Contract Marriage", "f", "ready", A.Marcus, kemi, 100, 100, null, 90),
    story("Fake It Till Christmas", "Christmas, Fake Dating", "f", "pitched", A.Grace, wren, 48, 48, null, 100),
    story("Signed, Sealed, His", "Contract Marriage", "f", "signed", A.Grace, wren, 130, 130, null, 140),
    story("Apocalypse Ascendant", "Apocalypse", "m", "signed", A.Marcus, kemi, 220, 220, null, 160),
    story("The Clause", "Age Gap", "f", "declined", A.Marcus, kemi, 80, 80, null, 170)];
  const T = title => stories.find(s => s.title === title);
  const writer_logs = [
    { id: uuid(), writer_id: wren.id, story_id: T("Second Chance Season").id, month: month(-1), chapters: 32, rate: 4, paid: false, paid_on: null },
    { id: uuid(), writer_id: wren.id, story_id: T("Ash & Ember").id, month: month(-2), chapters: 40, rate: 4, paid: true, paid_on: inDays(-28) },
    { id: uuid(), writer_id: kemi.id, story_id: T("Offside Hearts").id, month: month(-1), chapters: 30, rate: 3.5, paid: false, paid_on: null },
    { id: uuid(), writer_id: jonah.id, story_id: T("The Son-in-Law Returns").id, month: month(-1), chapters: 41, rate: 5, paid: false, paid_on: null }];
  const deal = (s, p, kind, value, status, days, signed) => ({ id: uuid(), created_at: ago(days), story_id: s.id, platform_id: p.id, kind, value, status, signed_on: signed ?? null, notes: null });
  const deals = [
    deal(T("Signed, Sealed, His"), goodnovel, "licence", 1800, "signed", 60, inDays(-40)),
    deal(T("Apocalypse Ascendant"), webnovel, "buyout", 6500, "signed", 70, inDays(-55)),
    deal(T("Fake It Till Christmas"), dreame, "licence", 1200, "negotiating", 10),
    deal(T("Fake It Till Christmas"), novelsnack, "licence", null, "pitched", 21),
    deal(T("The Clause"), goodnovel, "buyout", 3000, "declined", 90)];
  return { admins: [{ email: "you@dramreads.test", added_at: ago(200) }, { email: "partner@dramreads.test", added_at: ago(190) }], applications, scores, batches, writers, writer_logs, platforms, stories, deals };
}

export function install(role) {
  const db = seed();
  const outliner = db.applications.find(a => a.name === "Grace Lin");
  let session = null;
  const listeners = [];

  function from(table) {
    let op = "select", payload, filters = [], single = false, conflict, order;
    const q = {
      select() { return q; }, single() { single = true; return q; },
      order(k, o = {}) { order = [k, o.ascending !== false]; return q; },
      eq(k, v) { filters.push(r => r[k] === v); return q; },
      insert(r) { op = "insert"; payload = r; return q; }, update(r) { op = "update"; payload = r; return q; },
      delete() { op = "delete"; return q; }, upsert(r, o) { op = "upsert"; payload = r; conflict = o.onConflict.split(","); return q; },
      then(ok, bad) { return Promise.resolve(run()).then(ok, bad); },
    };
    const visible = () => role === "outliner" && table === "applications" ? db[table].filter(r => r.id === outliner.id) :
      role === "outliner" && table === "batches" ? db[table].filter(r => r.application_id === outliner.id) : db[table];
    function run() {
      const rows = db[table], match = r => filters.every(f => f(r)), out = data => ({ data: single ? data[0] ?? null : data, error: null });
      if (op === "select") { let d = visible().filter(match); if (order) d = [...d].sort((a, b) => String(a[order[0]]).localeCompare(String(b[order[0]])) * (order[1] ? 1 : -1)); return out(d.map(r => ({ ...r }))); }
      if (op === "delete") {
        if (table === "platforms" && db.deals.some(d => filters.every(f => f({ id: d.platform_id })))) return { data: null, error: { code: "23503", message: "in use" } };
        db[table] = rows.filter(r => !match(r)); return { error: null };
      }
      if (op === "update") { const hit = rows.filter(match); hit.forEach(r => Object.assign(r, payload)); return out(hit.map(r => ({ ...r }))); }
      if (op === "insert") {
        if (table === "batches" && rows.some(r => r.application_id === payload.application_id && r.month === payload.month)) return { data: null, error: { code: "23505", message: "duplicate" } };
        if (table === "platforms" && rows.some(r => r.name.toLowerCase() === payload.name.toLowerCase())) return { data: null, error: { code: "23505", message: "duplicate" } };
        const row = { id: uuid(), created_at: new Date().toISOString(), ...(table === "batches" ? { approved: 0, status: "submitted", paid: false, rate: null } : {}), ...(table === "writer_logs" || table === "deals" ? { paid: false } : {}), ...(table === "admins" ? { added_at: new Date().toISOString() } : {}), ...payload };
        rows.push(row); return out([{ ...row }]);
      }
      const row = { reviewer: "you@dramreads.test", ...payload }, old = rows.find(r => conflict.every(k => r[k] === row[k]));
      old ? Object.assign(old, row) : rows.push(row); return { error: null };
    }
    return q;
  }

  const user = role === "outliner" ? outliner.email : "you@dramreads.test";
  window.DR_SUPABASE = { url: "demo", anonKey: "demo" };
  window.supabase = { createClient: () => ({
    from,
    auth: {
      getSession: async () => ({ data: { session } }),
      signInWithPassword: async () => (session = { user: { email: user } }, { data: { session }, error: null }),
      signInWithOtp: async () => { session = { user: { email: user } }; setTimeout(() => listeners.forEach(f => f("SIGNED_IN", session)), 900); return { error: null }; },
      onAuthStateChange: f => listeners.push(f),
      signOut: async () => { session = null; return {}; },
    },
    storage: { from: () => ({
      upload: async () => ({ data: {}, error: null }),
      createSignedUrl: async () => ({ data: { signedUrl: "data:text/plain,This is where the uploaded document opens." }, error: null }) }) },
  }) };

  const note = document.createElement("p");
  note.className = "demo-note";
  note.title = "Tap to hide";
  note.onclick = () => note.remove();
  note.innerHTML = `Demo with sample data. Nothing you change is saved. ${role === "outliner" ? "Press <b>Email me a sign-in link</b> to enter as Grace." : "Press <b>Email me a sign-in link</b> to enter."}`;
  document.body.append(note);
}
