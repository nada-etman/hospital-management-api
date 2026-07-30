const prisma = require('../config/db');

class PatientRepository {
  create(data) {
    return prisma.patient.create({ data });
  }

  findAll({ skip, take, where }) {
    return prisma.patient.findMany({
      skip,
      take,
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { id: 'desc' },
    });
  }

  count(where) {
    return prisma.patient.count({ where });
  }

  findById(id) {
    return prisma.patient.findFirst({
      where: { id, isDeleted: false },
      include: { user: true, appointments: true, records: true, bills: true },
    });
  }

  update(id, data) {
    return prisma.patient.update({ where: { id }, data });
  }

  softDelete(id) {
    return prisma.patient.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
  }
}

module.exports = new PatientRepository();
