class AppError extends Error {
  constructor(messsage, statusCode) {
    super(messsage);
    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.contructor);
  }
}

module.exports = AppError;
