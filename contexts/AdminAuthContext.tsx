import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserRegister } from '../types/auth'; // Using correct types
import { authService } from '../services/authService';
import { jwtDecode } from 'jwt-decode';

interface AdminAuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: UserRegister) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load: Check for token
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    // 1. Decode generic check
                    const decoded: any = jwtDecode(token);
                    const currentTime = Date.now() / 1000;

                    if (decoded.exp < currentTime) {
                        throw new Error("Token expired");
                    }

                    // 2. Fetch fresh user data from backend
                    const userData = await authService.getCurrentUser();
                    setUser(userData);
                } catch (e) {
                    console.error("Session restoration failed:", e);
                    authService.logout();
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            // 1. Call API
            const tokens = await authService.login({ email, password });

            // 2. Storage
            localStorage.setItem('access_token', tokens.access_token);
            localStorage.setItem('refresh_token', tokens.refresh_token);

            // 3. Set User State immediately (optimistic or fetch)
            const userData = await authService.getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.error("Login failed:", error);
            throw error; // Propagate to component for error handling
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: UserRegister) => {
        setIsLoading(true);
        try {
            await authService.register(data);
            // Auto login after register
            await login(data.email, data.password);
        } catch (error) {
            console.error("Registration failed:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        // Optional: Redirect
    };

    return (
        <AdminAuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            login,
            register,
            logout,
            isLoading
        }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
};
