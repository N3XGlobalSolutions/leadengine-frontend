import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { authService } from './authService';

// Default to localhost:8000 if not specified
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Token Refresh State ---
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

/**
 * Process the queue of failed requests after token refresh
 */
const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token!);
        }
    });
    failedQueue = [];
};

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

// Response Interceptor: Handle 401 with Token Refresh
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Only handle 401 errors
        if (error.response?.status !== 401) {
            return Promise.reject(error);
        }

        // Prevent infinite loops - if the refresh endpoint itself fails, logout
        if (originalRequest?.url?.includes('/auth/refresh') || originalRequest?.url?.includes('/auth/login')) {
            authService.logout();
            window.location.href = '/admin/login';
            return Promise.reject(error);
        }

        // Prevent multiple retry attempts on the same request
        if (originalRequest._retry) {
            authService.logout();
            window.location.href = '/admin/login';
            return Promise.reject(error);
        }

        // Check if we have a refresh token
        if (!authService.hasRefreshToken()) {
            authService.logout();
            window.location.href = '/admin/login';
            return Promise.reject(error);
        }

        // If already refreshing, queue this request
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    originalRequest.headers.set('Authorization', `Bearer ${token}`);
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        // Start the refresh process
        originalRequest._retry = true;
        isRefreshing = true;

        try {
            // Attempt to refresh the token
            const newToken = await authService.refreshToken();

            // Process queued requests with new token
            processQueue(null, newToken);

            // Retry the original request with new token
            originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
            return api(originalRequest);
        } catch (refreshError) {
            // Refresh failed - logout and redirect
            processQueue(refreshError, null);
            authService.logout();
            window.location.href = '/admin/login';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);
