import axios from 'axios';
import { api } from './api';
import { AuthResponse, User, UserLogin, UserRegister } from '../types/auth';

// Base URL for refresh calls (uses raw axios to avoid interceptor loops)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const authService = {
    async login(credentials: UserLogin): Promise<AuthResponse> {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    async getCurrentUser(): Promise<User> {
        const response = await api.get<User>('/auth/me');
        return response.data;
    },

    async register(data: UserRegister): Promise<User> {
        const response = await api.post<User>('/auth/register', data);
        return response.data;
    },

    /**
     * Refresh the access token using the stored refresh token.
     * Uses raw axios to avoid circular dependency with api interceptors.
     */
    async refreshToken(): Promise<string> {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        // Use raw axios to avoid interceptor loops
        const response = await axios.post(`${BASE_URL}/auth/refresh`, null, {
            params: { refresh_token: refreshToken }
        });

        const newAccessToken = response.data.access_token;
        localStorage.setItem('access_token', newAccessToken);
        return newAccessToken;
    },

    /**
     * Get the stored access token
     */
    getAccessToken(): string | null {
        return localStorage.getItem('access_token');
    },

    /**
     * Get the stored refresh token
     */
    getRefreshToken(): string | null {
        return localStorage.getItem('refresh_token');
    },

    /**
     * Check if user has a refresh token stored
     */
    hasRefreshToken(): boolean {
        return !!localStorage.getItem('refresh_token');
    },

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
};
