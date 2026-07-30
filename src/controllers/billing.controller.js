const prisma = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { NotFoundError } = require('../errors');

exports.createBilling = async (req, res, next) => {
  try {
    const { patientId, appointmentId, amount } = req.body;
    const billing = await prisma.billing.create({ data: { patientId, appointmentId, amount } });
    return ApiResponse.success(res, { message: 'Invoice created', data: billing, statusCode: 201 });
  } catch (err) {
    next(err);
  }
};

exports.getAllBillings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const billings = await prisma.billing.findMany({
      where,
      include: { patient: { include: { user: { select: { name: true, email: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return ApiResponse.success(res, { message: 'Invoices fetched', data: billings });
  } catch (err) {
    next(err);
  }
};

exports.getBillingById = async (req, res, next) => {
  try {
    const billing = await prisma.billing.findUnique({ where: { id: Number(req.params.id) } });
    if (!billing) throw new NotFoundError('Invoice');
    return ApiResponse.success(res, { message: 'Invoice fetched', data: billing });
  } catch (err) {
    next(err);
  }
};

exports.updateBillingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const billing = await prisma.billing.update({ where: { id: Number(req.params.id) }, data: { status } });
    return ApiResponse.success(res, { message: 'Invoice status updated', data: billing });
  } catch (err) {
    next(err);
  }
};
