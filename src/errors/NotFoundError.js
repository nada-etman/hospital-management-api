const AppError = require('./AppError');

class NotFoundError extends AppError {
  constructor(entity = 'Resource') {
    super(`${entity} not found`, 404);
  }
}

module.exports = NotFoundError;
