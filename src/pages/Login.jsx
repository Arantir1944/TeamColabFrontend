import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { Container, TextField, Button, Typography, Box, Paper } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await login(email, password);
            navigate("/dashboard");
        } catch (error) {
            setError("Invalid email or password.");
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
                {error && <Typography color="error" align="center">{error}</Typography>}
                <form onSubmit={handleSubmit}>
                    <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" required />
                    <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required />
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Login</Button>
                </form>
            </Paper>
        </Container>
    );
}
