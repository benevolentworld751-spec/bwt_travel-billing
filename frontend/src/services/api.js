import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// ✅ Request Interceptor: Attaches Token to every request
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  console.log("Interceptor running");
  console.log("Stored user:", userStr);

  if (userStr) {
    const user = JSON.parse(userStr);
    console.log("Token found:", user.token);

    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }

  return config;
});

// ✅ Response Interceptor: Handles Token Expiry (Optional but recommended)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token is invalid, force logout
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;