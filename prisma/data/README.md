## Data pipeline

```
healthcare_dataset.csv          (raw Kaggle file, as downloaded)
      │  npm run clean-data
      ▼
healthcare_dataset.clean.csv    (deduped + fixed — what seed.js actually reads)
      │  npm run seed
      ▼
Postgres (Patient / Doctor / MedicalRecord / Appointment / Billing)
```

Source: Kaggle "Healthcare Dataset" (prasad22). Columns: `Name, Age, Gender,
Blood Type, Medical Condition, Date of Admission, Doctor, Hospital,
Insurance Provider, Billing Amount, Room Number, Admission Type, Discharge
Date, Medication, Test Results`.

### 1. Clean it

```bash
npm run clean-data
```

This reads `healthcare_dataset.csv` and writes `healthcare_dataset.clean.csv`,
fixing the issues actually found in this file (534 exact duplicate rows,
106 negative Billing Amount values, and random per-letter casing on Name).
See `clean-dataset.js` for the exact rules. Re-run it any time you drop in a
fresh copy of the raw file. `seed.js` automatically falls back to the raw
file (with a warning) if the clean file isn't present.

### 2. Seed it

```bash
npm run seed
```

By default this seeds the **entire cleaned file** (~55,000 rows -> ~55,000
patients + ~40,300 doctors, since almost every row has a distinct doctor
name in this dataset — that's a real quirk of the source data, not a bug).
That's a lot of writes, so:

- It runs with limited concurrency (`SEED_CONCURRENCY`, default 10) instead
  of one row at a time, and prints progress every ~1,000 rows.
- Expect the full run to take a while (order of tens of minutes) depending
  on your database.
- If you want to test on a slice first, run `SEED_LIMIT=200 npm run seed`.
- If you see Postgres "too many connections" / pool timeout errors, lower
  `SEED_CONCURRENCY` or add `?connection_limit=20&pool_timeout=60` to
  `DATABASE_URL`.
