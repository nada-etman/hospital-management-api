class ApiResponse {
  static success(res, { message = 'Success', data = null, statusCode = 200, meta = null }) {
    const response = { success: true, message, data };
    if (meta) response.meta = meta;
    return res.status(statusCode).json(response);
  }

  static error(res, { message = 'Something went wrong', statusCode = 500, errors = null }) {
    const response = { success: false, message };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;
