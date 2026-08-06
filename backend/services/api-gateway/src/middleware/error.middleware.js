export function notFoundMiddleware(req, res) {
  res.status(404).json({
    data: null,
    meta: {
      requestId: req.requestId
    },
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
}

export function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    data: null,
    meta: {
      requestId: req.requestId
    },
    error: {
      code,
      message
    }
  });
}