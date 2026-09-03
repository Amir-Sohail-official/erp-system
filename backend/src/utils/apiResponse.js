export const successResponse = (data, message = 'Operation successful') => ({
  success: true,
  message,
  data,
});

export const errorResponse = (message, errors = []) => ({
  success: false,
  message,
  errors,
});
