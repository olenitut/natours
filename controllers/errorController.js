const AppError = require("../utils/AppError");

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    if (!err.isOperational) {
      console.error("ERROR");

      res.status(500).json({
        status: "error",
        message: "Something went very wrong",
      });

      return;
    }

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    if (!err.isOperational) {
      res.status(err.statusCode).render("error", {
        title: "Something went wrong!",
        msg: "Please try again later",
      });

      return;
    }

    res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message,
    });
  }
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateKeysDB = (err) => {
  const message = `Duplicate field value: ${JSON.stringify(err.keyValue)}.`;
  return new AppError(message, 400);
};

const handleValidatonDB = (err) => {
  const errors = Object.values(err.errors)
    .map((error) => error.message)
    .join(". ");
  const message = `Invalid input data! ${errors}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError("Invalid token. Please log in again", 401);
};

const handleJWTExpiredError = () => {
  return new AppError("Your token has expired. Please, log in again!", 401);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = JSON.parse(JSON.stringify(err));
    error.message = err.message;
    if (error.name === "CastError") {
      error = handleCastErrorDB(error);
    }

    if (error.code === 11000) {
      error = handleDuplicateKeysDB(error);
    }

    if (error.name === "ValidationError") {
      error = handleValidatonDB(error);
    }

    if (error.name === "JsonWebTokenError") {
      error = handleJWTError();
    }

    if (error.name === "TokenExpiredError") {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, req, res);
  }
};
