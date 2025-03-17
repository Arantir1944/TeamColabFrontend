// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { getToken, getUserFromToken, login as authLogin, logout as authLogout } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // On mount, load user info from token if available.
    useEffect(() => {
        const token = getToken();
        if (token) {
            const currentUser = getUserFromToken();
            setUser(currentUser);
        }
    }, []);

    // Wrap the login function to update auth state.
    const login = async (email, password) => {
        await authLogin(email, password);
        const currentUser = getUserFromToken();
        setUser(currentUser);
    };

    // Wrap logout to update auth state.
    const logout = () => {
        authLogout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
