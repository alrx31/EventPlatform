'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AuthResult } from '@/types'
import api from '@/lib/api';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    role: string | null;
    isApprovedOrganizer: boolean;
    userName: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, firstName: string, lastName: string, role?: string) => Promise<void>;
    logout: () => void;
}

function decodeRole(token: string): string | null {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.role
            || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
            || null;
    } catch {
        return null;
    }
}

function decodeIsApprovedOrganizer(token: string): boolean {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.isApprovedOrganizer === 'True';
    } catch {
        return false;
    }
}

function decodeName(token: string): string | null {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(decodeURIComponent(escape(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))));
        const first = decoded.given_name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] || '';
        const last = decoded.family_name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] || '';
        const full = `${first} ${last}`.trim();
        return full || decoded.email || null;
    } catch {
        return null;
    }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);
    const [isApprovedOrganizer, setIsApprovedOrganizer] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        setIsAuthenticated(!!token);
        setRole(token ? decodeRole(token) : null);
        setIsApprovedOrganizer(token ? decodeIsApprovedOrganizer(token) : false);
        setUserName(token ? decodeName(token) : null);
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const response = await api.post<AuthResult>('/auth/login', { email, password });
        const { accessToken, refreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        document.cookie = `accessToken=${accessToken}; path=/; max-age=3600`;

        setIsAuthenticated(true);
        setRole(decodeRole(accessToken));
        setIsApprovedOrganizer(decodeIsApprovedOrganizer(accessToken));
        setUserName(decodeName(accessToken));
    };

    const register = async (email: string, password: string, firstName: string, lastName: string, role: string = 'User') => {
        const response = await api.post<AuthResult>('/auth/register', {
            email,
            password,
            firstName,
            lastName,
            role,
        });
        const { accessToken, refreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        document.cookie = `accessToken=${accessToken}; path=/; max-age=3600`;

        setIsAuthenticated(true);
        setRole(decodeRole(accessToken));
        setIsApprovedOrganizer(decodeIsApprovedOrganizer(accessToken));
        setUserName(decodeName(accessToken));
    };

    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        document.cookie = 'accessToken=; path=/; max-age=0';
        setIsAuthenticated(false);
        setRole(null);
        setIsApprovedOrganizer(false);
        setUserName(null);
    }, []);
    
    return (
        <AuthContext.Provider value={ {isAuthenticated, isLoading, role, isApprovedOrganizer, userName, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within a AuthProvider');
    }
    return context;
}