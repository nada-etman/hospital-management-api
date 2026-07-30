/**
 * Cleans prisma/data/healthcare_dataset.csv (the raw Kaggle file) into
 * prisma/data/healthcare_dataset.clean.csv, which is what seed.js actually
 * reads. Re-run this any time you drop in a fresh copy of the raw file:
 *
 *   npm run clean-data
 *
 * What it fixes, and why (found by inspecting the raw file):
 *   1. Exact duplicate rows (534 in the current file) -> dropped.
 *   2. Negative "Billing Amount" values -> an amount can't be negative,
 *      this is a data-entry sign error, so we take the absolute value
 *      rather than dropping the row. (108 negative rows exist in the raw
 *      file overall; a couple of those happen to also be exact-duplicate
 *      rows removed in step 1, so the final count fixed here is usually
 *      a little lower — the script prints the real number below, that's
 *      the one to trust, not this comment.)
 *   3. "Name" has random per-letter casing ("Bobby JacksOn", "LesLie
 *      TErRy") -> normalized to proper case ("Bobby Jackson").
 * Everything else in the file (Gender, Blood Type, Admission Type, Test
 * Results, date formats, Doctor name casing) was already consistent, so
 * it's left as-is.
 */
const fs = require('fs');
const path = require('path');
const { parseCsv, stringifyCsv } = require('./csv-utils');

const RAW_PATH = path.join(__dirname, 'healthcare_dataset.csv');
const CLEAN_PATH = path.join(__dirname, 'healthcare_dataset.clean.csv');

function normalizeName(name) {
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function main() {
  if (!fs.existsSync(RAW_PATH)) {
    console.error(`Raw file not found at ${RAW_PATH}. Drop the Kaggle CSV there first.`);
    process.exit(1);
  }

  const raw = fs.readFileSync(RAW_PATH, 'utf-8');
  const parsed = parseCsv(raw);
  const header = parsed[0];
  const nameIdx = header.findIndex((h) => h.trim().toLowerCase() === 'name');
  const billingIdx = header.findIndex((h) => h.trim().toLowerCase() === 'billing amount');
  const dataRows = parsed.slice(1);

  // 1. Trim every field.
  let rows = dataRows.map((r) => r.map((v) => (v ?? '').trim()));

  // 2. Drop exact duplicate rows.
  const seen = new Set();
  let duplicateCount = 0;
  rows = rows.filter((r) => {
    const key = r.join('\u0001');
    if (seen.has(key)) {
      duplicateCount++;
      return false;
    }
    seen.add(key);
    return true;
  });

  // 3. Fix negative billing amounts and normalize names.
  let negativeBillingCount = 0;
  rows = rows.map((r) => {
    const row = [...r];
    if (nameIdx !== -1) row[nameIdx] = normalizeName(row[nameIdx]);
    if (billingIdx !== -1) {
      const amount = parseFloat(row[billingIdx]);
      if (!isNaN(amount) && amount < 0) {
        negativeBillingCount++;
        row[billingIdx] = String(Math.abs(amount));
      }
    }
    return row;
  });

  fs.writeFileSync(CLEAN_PATH, stringifyCsv([header, ...rows]));

  console.log(`Read ${dataRows.length} rows from healthcare_dataset.csv`);
  console.log(`Removed ${duplicateCount} exact duplicate rows`);
  console.log(`Fixed ${negativeBillingCount} negative Billing Amount values (took absolute value)`);
  console.log(`Normalized casing on the Name column`);
  console.log(`Wrote ${rows.length} clean rows to healthcare_dataset.clean.csv`);
}

main();
