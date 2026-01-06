import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Default to localhost:8000 if not specified
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token and Handle FormData
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.set('Authorization', `Bearer ${token}`);
        }

        // If the request body is FormData, remove Content-Type to let axios set it with boundary
        if (config.data instanceof FormData) {
            config.headers.delete('Content-Type');
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 (Auto Logout)
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            const originalRequest = error.config;

            // Prevent infinite loops if the refresh endpoint itself fails
            if (originalRequest?.url?.includes('/auth/refresh')) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/admin/login'; // Force redirect
                return Promise.reject(error);
            }

            // Optional: Implement Refresh Token Logic here if backend supports 'silent refresh'
            // For MVP Phase 1, we just logout
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            // window.location.href = '/admin/login'; // Can be handled by Context instead of hard redirect
        }
        return Promise.reject(error);
    }
);
