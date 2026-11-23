// Pay and score arithmetic for the admin dashboard, kept apart so it can be tested in Node.
export const CRITERIA = [["no_ai", "No AI traces"], ["originality", "Originality"], ["creativity", "Creativity"], ["market_fit", "Web story market fit"], ["storyline", "Storyline holds"]];

// A reviewer's total out of 25.
export const total = s => CRITERIA.reduce((n, [k]) => n + s[k], 0);

// Mean of every reviewer's total, to one decimal. null when nobody has scored yet.
export const average = scores => scores.length ? Math.round(scores.reduce((n, s) => n + total(s), 0) / scores.length * 10) / 10 : null;

// A batch approved in month M is paid on the 25th to 30th of month M+1. month is "YYYY-MM-01".
export const payWindow = month => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1)); // JS months are 0-based, so m is already the next month
  return { key: d.toISOString().slice(0, 7), label: `${d.toLocaleString("en", { month: "long", timeZone: "UTC" })} 25–30, ${d.getUTCFullYear()}` };
};

// Dollars owed for a batch, rounded to the cent.
export const payout = (approved, rate) => Math.round(approved * Number(rate || 0) * 100) / 100;

export const money = n => `$${n.toFixed(2)}`;
