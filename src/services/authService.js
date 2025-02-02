import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    localStorage.setItem("token", response.data.token);
    return response.data;
};

export const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
};

export const getToken = () => localStorage.getItem("token");
