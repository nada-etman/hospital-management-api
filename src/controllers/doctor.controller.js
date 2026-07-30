const prisma = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { NotFoundError } = require('../errors');
const { getPagination, buildMeta } = require('../utils/pagination.util');

exports.createDoctor = async (req, res, next) => {
  try {
    const { userId, specialization, licenseNo, departmentId } = req.body;
    const doctor = await prisma.doctor.create({
      data: { userId, specialization, licenseNo, departmentId },
    });
    return ApiResponse.success(res, { message: 'Doctor created', data: doctor, statusCode: 201 });
  } catch (err) {
    next(err);
  }
};

exports.getAllDoctors = async (req, res, next) => {
  try {
    const { specialization, departmentId, search } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const where = { isDeleted: false };
    if (specialization) where.specialization = { contains: specialization, mode: 'insensitive' };
    if (departmentId) where.departmentId = Number(departmentId);
    if (search) where.user = { name: { contains: search, mode: 'insensitive' } };

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: { name: true, email: true } }, department: true },
      }),
      prisma.doctor.count({ where }),
    ]);

    return ApiResponse.success(res, {
      message: 'Doctors fetched',
      data: doctors,
      meta: buildMeta(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.getDoctorById = async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: true, department: true, appointments: true },
    });
    if (!doctor) throw new NotFoundError('Doctor');
    return ApiResponse.success(res, { message: 'Doctor fetched', data: doctor });
  } catch (err) {
    next(err);
  }
};

exports.updateDoctor = async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.update({ where: { id: Number(req.params.id) }, data: req.body });
    return ApiResponse.success(res, { message: 'Doctor updated', data: doctor });
  } catch (err) {
    next(err);
  }
};

exports.deleteDoctor = async (req, res, next) => {
  try {
    await prisma.doctor.update({
      where: { id: Number(req.params.id) },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    return ApiResponse.success(res, { message: 'Doctor deleted' });
  } catch (err) {
    next(err);
  }
};
