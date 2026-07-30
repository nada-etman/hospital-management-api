/**
 * Seed script.
 *
 * Seeds from the FULL Kaggle dataset at prisma/data/healthcare_dataset.csv
 * (https://www.kaggle.com/datasets/prasad22/healthcare-dataset) — all
 * ~55,500 rows by default.
 *
 * Columns in that CSV:
 *   Name, Age, Gender, Blood Type, Medical Condition, Date of Admission,
 *   Doctor, Hospital, Insurance Provider, Billing Amount, Room Number,
 *   Admission Type, Discharge Date, Medication, Test Results
 *
 * IMPORTANT — read before you run this:
 *   - The dataset has ~40,300 distinct "Doctor" names out of 55,500 rows —
 *     almost every row has its own doctor. That's a quirk of this Kaggle
 *     dataset, not a bug here: it means seeding the full file creates
 *     ~40,300 doctor accounts alongside ~55,500 patient accounts. That's
 *     not what a real hospital looks like, but it IS what's in the file,
 *     and you asked for all of it to be real, so nothing is filtered out.
 *   - This is ~200,000+ writes total (users, patients, doctors, medical
 *     records, appointments, billing). Even with concurrency, expect this
 *     to run for a while (order of tens of minutes, depending on your DB).
 *     It prints progress every 1,000 rows so you can see it's alive.
 *   - Your Postgres connection pool needs to be able to handle the
 *     concurrency below. If you hit "too many connections" or pool
 *     timeout errors, either lower SEED_CONCURRENCY or add
 *     `?connection_limit=20&pool_timeout=60` to DATABASE_URL.
 *   - Want to test on a smaller slice first (recommended before the full
 *     run)? `SEED_LIMIT=200 npm run seed`.
 *
 * For every row we create:
 *   - a User + Patient (Name, Age -> approx dob, Gender, Blood Type)
 *   - a User + Doctor for the row's "Doctor" name (deduped — same doctor
 *     name across rows is only created once)
 *   - a MedicalRecord (Medical Condition -> diagnosis, Medication ->
 *     prescription, Test Results/Hospital/Admission Type/Insurance -> notes)
 *   - an Appointment (Date of Admission -> date, Medical Condition -> reason)
 *   - a Billing row (Billing Amount -> amount) linked to that appointment
 *
 * If the CSV is missing, the script falls back to @faker-js/faker so the
 * project still seeds cleanly out of the box.
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');
const { parseCsv } = require('./data/csv-utils');

const prisma = new PrismaClient();
// Reads the CLEANED file (deduped, negative billing fixed, names normalized).
// Run `npm run clean-data` first if this doesn't exist yet or you dropped in
// a fresh raw CSV. Falls back to the raw file if no clean file is present.
const CLEAN_CSV_PATH = path.join(__dirname, 'data', 'healthcare_dataset.clean.csv');
const RAW_CSV_PATH = path.join(__dirname, 'data', 'healthcare_dataset.csv');
// No limit by default -> the whole file. Override to test on a slice first.
const SEED_LIMIT = process.env.SEED_LIMIT ? parseInt(process.env.SEED_LIMIT, 10) : Infinity;
// How many rows to process in parallel. Keep this <= your Postgres connection pool size.
const CONCURRENCY = parseInt(process.env.SEED_CONCURRENCY || '10', 10);

function loadCsvRows() {
  const usingClean = fs.existsSync(CLEAN_CSV_PATH);
  const CSV_PATH = usingClean ? CLEAN_CSV_PATH : RAW_CSV_PATH;
  if (!usingClean) {
    console.warn('healthcare_dataset.clean.csv not found — seeding from the raw file. Run `npm run clean-data` first for deduped/fixed data.');
  }
  if (!fs.existsSync(CSV_PATH)) return null;
  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const parsed = parseCsv(raw);
  const headers = parsed[0].map((h) => h.trim().toLowerCase());
  const limit = Number.isFinite(SEED_LIMIT) ? SEED_LIMIT : parsed.length - 1;
  const dataRows = parsed.slice(1, 1 + limit);

  return dataRows.map((values) => {
    const row = {};
    headers.forEach((h, i) => (row[h] = values[i]?.trim()));
    return row;
  });
}

/** "Bobby JacksOn" -> "Bobby Jackson" (the Kaggle names have random casing). */
function normalizeName(name) {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function slugify(name, suffix) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/(^\.|\.$)/g, '') + suffix
  );
}

function approxDobFromAge(age) {
  const currentYear = new Date().getFullYear();
  const year = currentYear - (parseInt(age, 10) || 30);
  const month = faker.number.int({ min: 0, max: 11 });
  const day = faker.number.int({ min: 1, max: 28 });
  return new Date(year, month, day);
}

/** Run async tasks with limited concurrency, logging progress every `logEvery` items. */
async function runInBatches(items, worker, { concurrency = CONCURRENCY, label = '', logEvery = 1000 } = {}) {
  let done = 0;
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    await Promise.all(chunk.map((item) => worker(item)));
    done += chunk.length;
    if (label && (done % logEvery < concurrency || done === items.length)) {
      console.log(`  ${label}: ${done}/${items.length}`);
    }
  }
}

async function main() {
  const password = await bcrypt.hash('Password123!', 10);

  // --- Admin account (always created so you can log in immediately) ---
  await prisma.user.upsert({
    where: { email: 'admin@hospital.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@hospital.com',
      password,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // --- Departments ---
  const departmentNames = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology'];
  const departments = [];
  for (const name of departmentNames) {
    const dep = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} department` },
    });
    departments.push(dep);
  }

  // --- Receptionist ---
  await prisma.user.upsert({
    where: { email: 'reception@hospital.com' },
    update: {},
    create: { name: 'Front Desk', email: 'reception@hospital.com', password, role: 'RECEPTIONIST', isVerified: true },
  });

  const csvRows = loadCsvRows();

  if (!csvRows) {
    // --- Fallback: fully fake demo data (no CSV found) ---
    for (let i = 0; i < 6; i++) {
      const email = faker.internet.email().toLowerCase();
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { name: faker.person.fullName(), email, password, role: 'DOCTOR', isVerified: true },
      });
      await prisma.doctor.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          specialization: faker.helpers.arrayElement(['Cardiologist', 'Neurologist', 'Pediatrician', 'Orthopedist']),
          licenseNo: faker.string.alphanumeric(8).toUpperCase(),
          departmentId: faker.helpers.arrayElement(departments).id,
        },
      });
    }

    for (let i = 0; i < 15; i++) {
      const name = faker.person.fullName();
      const email = faker.internet.email({ firstName: name.split(' ')[0] }).toLowerCase();
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { name, email, password, role: 'PATIENT', isVerified: true },
      });
      await prisma.patient.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          dob: faker.date.birthdate({ min: 1, max: 90, mode: 'age' }),
          gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          bloodType: faker.helpers.arrayElement(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
        },
      });
    }

    console.log('Seeding done. Patients seeded from: faker (no CSV found at prisma/data/healthcare_dataset.csv)');
    console.log('Login with: admin@hospital.com / Password123!');
    return;
  }

  console.log(`Loaded ${csvRows.length} rows from healthcare_dataset.csv. Concurrency: ${CONCURRENCY}.`);

  // --- Doctors: one per unique "Doctor" name found in the CSV ---
  const specializations = ['Cardiologist', 'Neurologist', 'Pediatrician', 'Orthopedist', 'Dermatologist'];
  const uniqueDoctorNames = [...new Set(csvRows.map((row) => normalizeName(row.doctor || 'Unknown Doctor')))];
  const doctorByName = new Map();

  console.log(`Creating ${uniqueDoctorNames.length} unique doctors...`);
  await runInBatches(
    uniqueDoctorNames,
    async (doctorName) => {
      const email = slugify(doctorName, '.doc@hospital.com');
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { name: doctorName, email, password, role: 'DOCTOR', isVerified: true },
      });
      const doctor = await prisma.doctor.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          specialization: faker.helpers.arrayElement(specializations),
          licenseNo: faker.string.alphanumeric(8).toUpperCase(),
          departmentId: faker.helpers.arrayElement(departments).id,
        },
      });
      doctorByName.set(doctorName, doctor);
    },
    { label: 'Doctors' }
  );

  // --- Patients + MedicalRecord + Appointment + Billing, one set per CSV row ---
  console.log(`Creating ${csvRows.length} patients (+ medical records, appointments, billing)...`);
  await runInBatches(
    csvRows.map((row, i) => ({ row, i })),
    async ({ row, i }) => {
      const name = normalizeName(row.name || faker.person.fullName());
      const email = slugify(name, `.${i}@patientmail.com`);

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { name, email, password, role: 'PATIENT', isVerified: true },
      });

      const patient = await prisma.patient.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          dob: approxDobFromAge(row.age),
          gender: row.gender?.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE',
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          bloodType: row['blood type'] || null,
        },
      });

      const doctorName = normalizeName(row.doctor || 'Unknown Doctor');
      const doctor = doctorByName.get(doctorName);
      if (!doctor) return;

      await prisma.medicalRecord.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          diagnosis: row['medical condition'] || 'Unspecified',
          prescription: row.medication || null,
          notes: `Test results: ${row['test results'] || 'N/A'}. Admission type: ${row['admission type'] || 'N/A'}. Hospital: ${row.hospital || 'N/A'}. Insurance: ${row['insurance provider'] || 'N/A'}. Room: ${row['room number'] || 'N/A'}.`,
        },
      });

      const admissionDate = row['date of admission'] ? new Date(row['date of admission']) : faker.date.recent({ days: 365 });
      const appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          date: isNaN(admissionDate) ? faker.date.recent({ days: 365 }) : admissionDate,
          reason: row['medical condition'] || 'Check-up',
          status: row['discharge date'] ? 'COMPLETED' : 'CONFIRMED',
        },
      });

      const amount = parseFloat(row['billing amount']);
      await prisma.billing.create({
        data: {
          patientId: patient.id,
          appointmentId: appointment.id,
          amount: isNaN(amount) ? faker.number.float({ min: 100, max: 20000, fractionDigits: 2 }) : amount,
          status: faker.helpers.arrayElement(['PAID', 'UNPAID']),
        },
      });
    },
    { label: 'Patients' }
  );

  console.log(`\nSeeding done. ${csvRows.length} patients + ${doctorByName.size} doctors seeded from prisma/data/healthcare_dataset.csv.`);
  console.log('Login with: admin@hospital.com / Password123!');
  console.log('(All seeded users share the password: Password123!)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
