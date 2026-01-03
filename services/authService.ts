import { api } from './api';
import { AuthResponse, User, UserLogin, UserRegister } from '../types/auth';

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

    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }
};
