export interface IApiCode {
  code: number;
  message: string;
  success: boolean;
}

export const API_CODES = {
  OK: {
    code: 200,
    message: 'Completed successfully.',
    success: true,
  },
  CREATED: {
    code: 201,
    message: 'Successfully created.',
    success: true,
  },
  BAD_REQUEST: {
    code: 400,
    message: 'Invalid syntax for this request was provided.',
    success: false,
  },
  UNAUTHORIZED: {
    code: 401,
    message: 'You are unauthorized to access the requested resource.',
    success: false,
  },
  FORBIDDEN: {
    code: 403,
    message: 'Your account is not authorized to access the requested resource.',
    success: false,
  },
  NOT_FOUND: {
    code: 404,
    message:
      'We could not find the resource you requested. Please refer to the documentation for the list of resources.',
    success: false,
  },
  CONFLICT: {
    code: 409,
    message: 'User with this email exists!',
    success: false,
  },
  TOO_MANY_REQUEST: {
    code: 429,
    message: 'Too many attempts detected. Please wait before trying again.',
    success: false,
  },
  INTERNAL_ERROR: {
    code: 500,
    message: 'Unexpected internal server error.',
    success: false,
  },
};
