export enum UserRole {
    PLATFORM_ADMIN = 'platform_admin',
    PLATFORM_OPERATOR = 'platform_operator',
    CLIENT_ADMIN = 'client_admin',
    SALES_TEAM = 'sales_team'
}

export interface User {
    user_id: string;
    email: string;
    full_name: string;
    role: UserRole;
    tenant_id: string | null;
    is_active: boolean;
    is_deleted?: boolean;
    last_login?: string;
    created_at?: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface TokenPayload {
    sub: string;         // user_id
    email: string;
    role: UserRole;
    tenant_id: string | null;
    exp: number;
}

export interface UserLogin {
    email: string;
    password: string;
}

export interface UserRegister {
    email: string;
    password: string;
    full_name: string;
    role?: UserRole;
    tenant_id?: string | null;
}
