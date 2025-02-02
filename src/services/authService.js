import axios from "axios";

const API_URL = "http://localhost:5000/api/auth"; // Backend URL

export const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    localStorage.setItem("token", response.data.token);
    return response.data;
};

export const logout = () => {
    localStorage.removeItem("token");
};

export const getCurrentUser = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT
        return payload;
    } catch (error) {
        return null;
    }
};
