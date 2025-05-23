// authService.js
import axios from "axios";
import jwt_decode from "jwt-decode";

const API_URL = "https://16.170.210.30:5001/api/auth";

export const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    // Ensure the token has the "Bearer " prefix
    const token = response.data.token;
    const formattedToken = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    localStorage.setItem("token", formattedToken);
    return response.data;
};

export const logout = () => {
    localStorage.removeItem("token");
    // Removed window.location.href so we can update state without a refresh.
};

export const getToken = () => localStorage.getItem("token");

export const getUserFromToken = () => {
    const token = getToken();
    if (!token) return null;

    // Remove the "Bearer " prefix if present
    const pureToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

    try {
        return jwt_decode(pureToken); // decode the token
    } catch (error) {
        console.error("Invalid token", error);
        return null;
    }
};

export const registerUser = async (userData) => {
    const token = getToken();
    const response = await axios.post(`${API_URL}/register`, userData, {
        headers: { Authorization: token }
    });
    return response.data;
};
