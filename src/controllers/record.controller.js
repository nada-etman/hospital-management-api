const prisma = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { NotFoundError } = require('../errors');

exports.createRecord = async (req, res, next) => {
  try {
    const { patientId, doctorId, diagnosis, prescription, notes } = req.body;
    const record = await prisma.medicalRecord.create({
      data: { patientId, doctorId, diagnosis, prescription, notes },
    });
    return ApiResponse.success(res, { message: 'Medical record created', data: record, statusCode: 201 });
  } catch (err) {
    next(err);
  }
};

exports.getRecordsByPatient = async (req, res, next) => {
  try {
    const records = await prisma.medicalRecord.findMany({
      where: { patientId: Number(req.params.patientId) },
      include: { doctor: { include: { user: { select: { name: true } } } } },
      orderBy: { date: 'desc' },
    });
    return ApiResponse.success(res, { message: 'Records fetched', data: records });
  } catch (err) {
    next(err);
  }
};

exports.getRecordById = async (req, res, next) => {
  try {
    const record = await prisma.medicalRecord.findUnique({ where: { id: Number(req.params.id) } });
    if (!record) throw new NotFoundError('Medical record');
    return ApiResponse.success(res, { message: 'Record fetched', data: record });
  } catch (err) {
    next(err);
  }
};

exports.updateRecord = async (req, res, next) => {
  try {
    const record = await prisma.medicalRecord.update({ where: { id: Number(req.params.id) }, data: req.body });
    return ApiResponse.success(res, { message: 'Record updated', data: record });
  } catch (err) {
    next(err);
  }
};

exports.deleteRecord = async (req, res, next) => {
  try {
    await prisma.medicalRecord.delete({ where: { id: Number(req.params.id) } });
    return ApiResponse.success(res, { message: 'Record deleted' });
  } catch (err) {
    next(err);
  }
};
