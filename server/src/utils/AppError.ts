class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  errObj: any = {};

  constructor(statusCode: number, message: string, errObj: any = {}) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.errObj = errObj;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
