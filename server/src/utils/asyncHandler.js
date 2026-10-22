/**
 * Wraps async Express route handlers to eliminate try/catch boilerplate
 * and pass unhandled rejections to the central error middleware.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
