const prisma = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { NotFoundError } = require('../errors');

exports.createDepartment = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const department = await prisma.department.create({ data: { name, description } });
    return ApiResponse.success(res, { message: 'Department created', data: department, statusCode: 201 });
  } catch (err) {
    next(err);
  }
};

exports.getAllDepartments = async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({ include: { doctors: true } });
    return ApiResponse.success(res, { message: 'Departments fetched', data: departments });
  } catch (err) {
    next(err);
  }
};

exports.getDepartmentById = async (req, res, next) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: Number(req.params.id) },
      include: { doctors: true },
    });
    if (!department) throw new NotFoundError('Department');
    return ApiResponse.success(res, { message: 'Department fetched', data: department });
  } catch (err) {
    next(err);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const department = await prisma.department.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    return ApiResponse.success(res, { message: 'Department updated', data: department });
  } catch (err) {
    next(err);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    await prisma.department.delete({ where: { id: Number(req.params.id) } });
    return ApiResponse.success(res, { message: 'Department deleted' });
  } catch (err) {
    next(err);
  }
};
