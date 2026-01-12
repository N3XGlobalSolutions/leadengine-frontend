import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, UserRegister } from '../types/auth';
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

// Refresh token 5 minutes before expiration
const REFRESH_BUFFER_SECONDS = 5 * 60;

// Check for token expiration every minute
const CHECK_INTERVAL_MS = 60 * 1000;

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Check if access token is expired or about to expire
     */
    const isTokenExpiringSoon = useCallback((bufferSeconds: number = 0): boolean => {
        const token = authService.getAccessToken();
        if (!token) return true;

        try {
            const decoded: any = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            return decoded.exp < (currentTime + bufferSeconds);
        } catch {
            return true;
        }
    }, []);

    /**
     * Attempt to refresh the access token silently
     */
    const silentRefresh = useCallback(async (): Promise<boolean> => {
        if (!authService.hasRefreshToken()) {
            return false;
        }

        try {
            await authService.refreshToken();
            console.log('🔄 Token refreshed proactively');
            return true;
        } catch (error) {
            console.error('❌ Proactive token refresh failed:', error);
            return false;
        }
    }, []);

    /**
     * Setup proactive token refresh interval
     */
    const setupRefreshInterval = useCallback(() => {
        // Clear any existing interval
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
        }

        // Check token expiration periodically
        refreshIntervalRef.current = setInterval(async () => {
            // If token is expiring soon, refresh proactively
            if (isTokenExpiringSoon(REFRESH_BUFFER_SECONDS)) {
                const success = await silentRefresh();
                if (!success && isTokenExpiringSoon(0)) {
                    // Token actually expired and refresh failed
                    console.log('⚠️ Session expired, logging out');
                    handleLogout();
                }
            }
        }, CHECK_INTERVAL_MS);
    }, [isTokenExpiringSoon, silentRefresh]);

    /**
     * Handle logout - clear state and tokens
     */
    const handleLogout = useCallback(() => {
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }
        authService.logout();
        setUser(null);
    }, []);

    // Initial Load: Check for token and try to restore session
    useEffect(() => {
        const initAuth = async () => {
            const token = authService.getAccessToken();

            if (token) {
                try {
                    // Check if token is expired
                    if (isTokenExpiringSoon(0)) {
                        // Token expired - try to refresh
                        console.log('🔄 Token expired on load, attempting refresh...');
                        const refreshed = await silentRefresh();

                        if (!refreshed) {
                            throw new Error('Token refresh failed');
                        }
                    }

                    // Fetch fresh user data from backend
                    const userData = await authService.getCurrentUser();
                    setUser(userData);

                    // Setup proactive refresh
                    setupRefreshInterval();
                } catch (e) {
                    console.error('Session restoration failed:', e);
                    authService.logout();
                }
            }
            setIsLoading(false);
        };

        initAuth();

        // Cleanup interval on unmount
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, [isTokenExpiringSoon, silentRefresh, setupRefreshInterval]);

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

            // 4. Setup proactive refresh interval
            setupRefreshInterval();
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
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
            console.error('Registration failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        handleLogout();
        // Redirect handled by ProtectedRoute or calling component
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
