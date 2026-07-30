const AppError = require('./AppError');

class ValidationError extends AppError {
  constructor(errors) {
    super('Validation failed', 400);
    this.errors = errors;
  }
}

module.exports = ValidationError;
