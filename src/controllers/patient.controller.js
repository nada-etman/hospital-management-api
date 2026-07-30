const patientService = require('../services/patient.service');
const ApiResponse = require('../utils/apiResponse');
const { getPagination, buildMeta } = require('../utils/pagination.util');

exports.createPatient = async (req, res, next) => {
  try {
    const patient = await patientService.createPatient(req.body);
    return ApiResponse.success(res, { message: 'Patient created successfully', data: patient, statusCode: 201 });
  } catch (err) {
    next(err);
  }
};

exports.getAllPatients = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { data, total } = await patientService.getPatients({ ...req.query, page, limit, skip });
    return ApiResponse.success(res, {
      message: 'Patients fetched successfully',
      data,
      meta: buildMeta(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.getPatientById = async (req, res, next) => {
  try {
    const patient = await patientService.getPatientById(Number(req.params.id));
    return ApiResponse.success(res, { message: 'Patient fetched successfully', data: patient });
  } catch (err) {
    next(err);
  }
};

exports.updatePatient = async (req, res, next) => {
  try {
    const patient = await patientService.updatePatient(Number(req.params.id), req.body);
    return ApiResponse.success(res, { message: 'Patient updated successfully', data: patient });
  } catch (err) {
    next(err);
  }
};

exports.deletePatient = async (req, res, next) => {
  try {
    await patientService.deletePatient(Number(req.params.id));
    return ApiResponse.success(res, { message: 'Patient deleted successfully' });
  } catch (err) {
    next(err);
  }
};
