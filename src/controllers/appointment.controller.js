const prisma = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const { NotFoundError, ConflictError } = require('../errors');

exports.createAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, date, reason } = req.body;

    // Prevent double-booking the same doctor at the same time.
    const conflict = await prisma.appointment.findFirst({
      where: { doctorId, date: new Date(date), status: { in: ['PENDING', 'CONFIRMED'] } },
    });
    if (conflict) throw new ConflictError('This time slot is already booked for this doctor');

    // Wrapped in a transaction so the appointment + its audit trail are atomic.
    const appointment = await prisma.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: { patientId, doctorId, date: new Date(date), reason },
      });
      await tx.auditLog.create({
        data: { userId: req.user?.id, action: 'CREATE', entity: 'Appointment', entityId: created.id },
      });
      return created;
    });

    return ApiResponse.success(res, { message: 'Appointment booked', data: appointment, statusCode: 201 });
  } catch (err) {
    next(err);
  }
};

exports.getAllAppointments = async (req, res, next) => {
  try {
    const { status, doctorId, patientId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (doctorId) where.doctorId = Number(doctorId);
    if (patientId) where.patientId = Number(patientId);

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        doctor: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { date: 'asc' },
    });

    return ApiResponse.success(res, { message: 'Appointments fetched', data: appointments });
  } catch (err) {
    next(err);
  }
};

exports.getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(req.params.id) },
      include: { patient: true, doctor: true, billing: true },
    });
    if (!appointment) throw new NotFoundError('Appointment');
    return ApiResponse.success(res, { message: 'Appointment fetched', data: appointment });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return ApiResponse.error(res, { message: 'Invalid status', statusCode: 400 });
    }
    const appointment = await prisma.appointment.update({
      where: { id: Number(req.params.id) },
      data: { status },
    });
    return ApiResponse.success(res, { message: 'Appointment status updated', data: appointment });
  } catch (err) {
    next(err);
  }
};

exports.deleteAppointment = async (req, res, next) => {
  try {
    await prisma.appointment.delete({ where: { id: Number(req.params.id) } });
    return ApiResponse.success(res, { message: 'Appointment deleted' });
  } catch (err) {
    next(err);
  }
};
