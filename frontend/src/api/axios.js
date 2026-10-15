import axios from 'axios';

// Axios instance with credentials (HttpOnly cookies) enabled
const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to normalize backend error format: { error: { code, message } }
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorData = error.response?.data?.error;
    const customError = new Error(
      errorData?.message || error.message || 'An unexpected error occurred.'
    );
    customError.code = errorData?.code || 'UNKNOWN_ERROR';
    customError.status = error.response?.status || 500;
    customError.details = errorData?.details;
    return Promise.reject(customError);
  }
);

export default api;
