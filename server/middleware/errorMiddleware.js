export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  let message = err.message;

  if (err.name === "ValidationError") {
    message = Object.values(err.errors).map((e) => e.message).join(", ");
    res.status(400);
  }
  if (err.code === 11000) {
    message = `Duplicate value for: ${Object.keys(err.keyValue).join(", ")}`;
    res.status(409);
  }

  res.status(res.statusCode === 200 ? statusCode : res.statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};