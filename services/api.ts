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
// Singleton promise: ensures only ONE refresh call is in flight at a time,
// even when multiple concurrent requests all hit 401 simultaneously.
let refreshPromise: Promise<string> | null = null;

// Queue of requests waiting for a refresh to complete
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

/**
 * Process the queue of failed requests with the result of a refresh attempt
 */
const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
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

// Response Interceptor: Handle 401 with Token Refresh (no forced redirects)
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Only intercept 401 errors
        if (error.response?.status !== 401) {
            return Promise.reject(error);
        }

        // If this is the login or refresh endpoint itself, just reject — don't loop
        if (
            originalRequest?.url?.includes('/auth/refresh') ||
            originalRequest?.url?.includes('/auth/login')
        ) {
            return Promise.reject(error);
        }

        // Prevent double-retrying the same request
        if (originalRequest._retry) {
            // The retry itself failed — clear tokens so the proactive refresh loop
            // in AdminAuthContext can detect expiry and show a graceful message.
            authService.logout();
            refreshPromise = null;
            return Promise.reject(error);
        }

        // If no refresh token is available, clear and reject — let the router handle navigation
        if (!authService.hasRefreshToken()) {
            authService.logout();
            return Promise.reject(error);
        }

        // Mark the original request as already retried
        originalRequest._retry = true;

        // If a refresh is already in flight, queue this request to retry after it resolves
        if (refreshPromise) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    originalRequest.headers.set('Authorization', `Bearer ${token}`);
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        // Start a singleton refresh — all concurrent 401s will share this promise
        refreshPromise = authService.refreshToken().finally(() => {
            refreshPromise = null;
        });

        try {
            const newToken = await refreshPromise;

            // Unblock all queued requests with the new token
            processQueue(null, newToken);

            // Retry the original request
            originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
            return api(originalRequest);
        } catch (refreshError) {
            // Refresh failed — unblock queued requests with error
            processQueue(refreshError, null);
            authService.logout();
            return Promise.reject(refreshError);
        }
    }
);
