import { Navigate } from "react-router-dom";
import { getToken } from "../services/authService";

export default function ProtectedRoute({ children }) {
    // Retrieve the token from localStorage. It will include the "Bearer " prefix.
    const token = getToken();
    // If a token exists, render the children; otherwise, redirect to login.
    return token ? children : <Navigate to="/login" replace />;
}
