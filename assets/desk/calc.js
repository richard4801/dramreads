// Pure arithmetic for the desk and portal. Tested in supabase/calc.test.mjs.
export const CRITERIA = [["no_ai", "No AI traces"], ["originality", "Originality"], ["creativity", "Creativity"], ["market_fit", "Web story market fit"], ["storyline", "Storyline holds"]];

// A reviewer's total out of 25, and the team's mean to one decimal (null when unscored).
export const total = s => CRITERIA.reduce((n, [k]) => n + s[k], 0);
export const average = scores => scores.length ? Math.round(scores.reduce((n, s) => n + total(s), 0) / scores.length * 10) / 10 : null;

export const money = n => `$${Number(n || 0).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const payout = (count, rate) => Math.round(count * Number(rate || 0) * 100) / 100;

// "YYYY-MM-01" for the month a date falls in.
export const monthOf = d => `${(d instanceof Date ? d : new Date(d)).toISOString().slice(0, 7)}-01`;
export const monthLabel = m => new Date(m).toLocaleDateString("en", { month: "long", year: "numeric", timeZone: "UTC" });

// Work done in month M is paid on the 25th to 30th of month M+1.
export const payWindow = month => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1)); // JS months are 0-based, so m is already the next month
  return { key: d.toISOString().slice(0, 7), label: `${d.toLocaleString("en", { month: "long", timeZone: "UTC" })} 25–30, ${d.getUTCFullYear()}` };
};

// Approved share of everything an outliner has had reviewed, as a whole percent (null before any review).
export const approvalRate = batches => {
  const done = batches.filter(b => b.status === "approved");
  const sent = done.reduce((n, b) => n + b.submitted, 0);
  return sent ? Math.round(done.reduce((n, b) => n + b.approved, 0) / sent * 100) : null;
};

// Everything owed, grouped by pay window, oldest first.
// Outliner batches count once approved; writer logs count as logged.
export const payroll = ({ batches, writerLogs, outliners, writers }) => {
  const windows = {};
  const add = (month, line) => {
    const w = payWindow(month);
    const g = (windows[w.key] ??= { key: w.key, label: w.label, lines: [], owed: 0, paid: 0 });
    g.lines.push(line); line.paid ? (g.paid += line.amount) : (g.owed += line.amount);
  };
  batches.filter(b => b.status === "approved").forEach(b => add(b.month, {
    kind: "outliner", table: "batches", id: b.id, who: outliners[b.application_id]?.name ?? "Removed outliner",
    detail: `${b.approved} outlines × ${money(b.rate)}`, amount: payout(b.approved, b.rate), paid: b.paid, month: b.month }));
  writerLogs.forEach(l => add(l.month, {
    kind: "writer", table: "writer_logs", id: l.id, who: writers[l.writer_id]?.name ?? "Removed writer",
    detail: `${l.chapters} chapters × ${money(l.rate)}`, amount: payout(l.chapters, l.rate), paid: l.paid, month: l.month }));
  return Object.values(windows).sort((a, b) => a.key.localeCompare(b.key));
};

// Days until a due date (negative when overdue), counted in whole UTC days.
export const daysUntil = (due, today = new Date()) =>
  due == null ? null : Math.round((Date.parse(due) - Date.parse(today.toISOString().slice(0, 10))) / 864e5);
