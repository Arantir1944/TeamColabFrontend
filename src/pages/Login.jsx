// src/pages/Login.jsx
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext"; // Use our auth context
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    Paper,
    CircularProgress,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext); // Get login from our auth context

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            await login(email, password); // Call the context's login function
            navigate("/dashboard");
        } catch (error) {
            setError("Invalid email or password.");
            setIsSubmitting(false);
        }
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 10 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Box display="flex" justifyContent="center" mb={2}>
                    <LockIcon color="primary" fontSize="large" />
                </Box>
                <Typography variant="h5" align="center" gutterBottom>
                    Sign In
                </Typography>
                {error && (
                    <Typography color="error" align="center">
                        {error}
                    </Typography>
                )}
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        margin="normal"
                        required
                    />
                    <Box sx={{ mt: 2, position: "relative" }}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={isSubmitting}
                        >
                            Login
                        </Button>
                        {isSubmitting && (
                            <CircularProgress
                                size={24}
                                sx={{
                                    color: "primary.main",
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    marginTop: "-12px",
                                    marginLeft: "-12px",
                                }}
                            />
                        )}
                    </Box>
                </form>
            </Paper>
        </Container>
    );
}
