const patientRepo = require('../repositories/patient.repository');
const { NotFoundError } = require('../errors');

class PatientService {
  createPatient(data) {
    return patientRepo.create({ ...data, dob: new Date(data.dob) });
  }

  async getPatients({ page = 1, limit = 10, skip = 0, search }) {
    const where = { isDeleted: false };
    if (search) {
      where.user = { name: { contains: search, mode: 'insensitive' } };
    }

    const [data, total] = await Promise.all([
      patientRepo.findAll({ skip, take: Number(limit), where }),
      patientRepo.count(where),
    ]);

    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async getPatientById(id) {
    const patient = await patientRepo.findById(id);
    if (!patient) throw new NotFoundError('Patient');
    return patient;
  }

  updatePatient(id, data) {
    if (data.dob) data.dob = new Date(data.dob);
    return patientRepo.update(id, data);
  }

  deletePatient(id) {
    return patientRepo.softDelete(id);
  }
}

module.exports = new PatientService();
