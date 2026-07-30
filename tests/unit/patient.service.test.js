jest.mock('../../src/repositories/patient.repository');
const patientRepo = require('../../src/repositories/patient.repository');
const patientService = require('../../src/services/patient.service');

describe('PatientService', () => {
  it('creates a patient with a Date object for dob', async () => {
    patientRepo.create.mockResolvedValue({ id: 1, dob: new Date('1990-01-01') });

    const result = await patientService.createPatient({
      userId: 1,
      dob: '1990-01-01',
      gender: 'MALE',
      phone: '0100000000',
      address: 'Cairo',
    });

    expect(patientRepo.create).toHaveBeenCalled();
    expect(result.id).toBe(1);
  });

  it('throws NotFoundError when patient does not exist', async () => {
    patientRepo.findById.mockResolvedValue(null);
    await expect(patientService.getPatientById(999)).rejects.toThrow('Patient not found');
  });
});
