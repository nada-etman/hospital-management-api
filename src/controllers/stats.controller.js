const prisma = require('../config/db');
const ApiResponse = require('../utils/apiResponse');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [totalPatients, totalDoctors, totalAppointments, todayAppointments, totalRevenue, appointmentsByStatus] =
      await Promise.all([
        prisma.patient.count({ where: { isDeleted: false } }),
        prisma.doctor.count({ where: { isDeleted: false } }),
        prisma.appointment.count(),
        prisma.appointment.count({ where: { date: { gte: startOfDay } } }),
        prisma.billing.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
        prisma.appointment.groupBy({ by: ['status'], _count: true }),
      ]);

    return ApiResponse.success(res, {
      message: 'Dashboard stats fetched',
      data: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        todayAppointments,
        totalRevenue: totalRevenue._sum.amount || 0,
        appointmentsByStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};
