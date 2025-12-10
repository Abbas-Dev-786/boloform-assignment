import { type NextFunction, type Request, type Response } from "express";
import AppError from "../utils/AppError.js";

const handleEmptyBodyError = () => {
  return new AppError(400, "Request body is required");
};

const sendErrorDev = (err: any, res: Response) => {
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    errObj: err.errObj,
    stack: err.stack,
    name: err.name,
    code: err.code,
  });
};

const sendErrorProd = (err: any, res: Response) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errObj: err.errObj,
      name: err.name,
    });
  } else {
    console.log(err + "💥");

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      name: err.name,
    });
  }
};

// handling invalid _id errors
const handleCastError = (err: any) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(400, message);
};

// handling validations error
const handleValidationError = (err: any) => {
  const errors = Object.values(err.errors).map((el: any) => el?.message);

  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(400, message);
};

// handling duplicate/ unique field errors
const handleDuplicateFieldError = (err: any) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)?.[0];

  const message = `Duplicate field value: ${value.replace(
    /['"]/g,
    ""
  )}. Please use another value!`;
  return new AppError(400, message);
};

// JWT Generation error handler
const handleJWTError = () =>
  new AppError(401, "Invalid token. Please log in again!");

// JWT Expired Error handler
const handleJWTExpiredError = () =>
  new AppError(401, "Your token has expired! Please log in again.");

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "dev") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "prod") {
    let error = Object.create(err);

    // if (
    //   !req.body &&
    //   req.method === "POST" &&
    //   Object.keys(req.body).length === 0
    // )
    //   error = handleEmptyBodyError();
    if (error.name === "CastError") error = handleCastError(error);
    if (error.code === 11000) error = handleDuplicateFieldError(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
    if (error.name === "ValidationError") error = handleValidationError(error);

    sendErrorProd(error, res);
  }
};
