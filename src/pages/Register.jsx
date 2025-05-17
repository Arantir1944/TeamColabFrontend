// src/pages/Register.jsx
import React, { useState, useEffect } from "react";
import {
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    MenuItem,
} from "@mui/material";
import { registerUser, getToken } from "../services/authService";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "Employee",
        teamId: "",
    });
    const [teams, setTeams] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Fetch teams from the protected endpoint
    const fetchTeams = async () => {
        try {
            const response = await axios.get("https://16.170.210.30:5001/api/teams", {
                headers: { Authorization: getToken() },
            });
            setTeams(response.data.teams);
        } catch (error) {
            console.error("Error fetching teams", error);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await registerUser(formData);
            setSuccess(data.message);
            setError(null);
            navigate("/dashboard");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Registration failed");
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 5 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Register New User
                </Typography>
                {error && <Typography color="error">{error}</Typography>}
                {success && <Typography color="primary">{success}</Typography>}
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Role"
                        name="role"
                        select
                        value={formData.role}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                    >
                        <MenuItem value="Manager">Manager</MenuItem>
                        <MenuItem value="Team Leader">Team Leader</MenuItem>
                        <MenuItem value="Employee">Employee</MenuItem>
                    </TextField>
                    {/* Dropdown for selecting a team */}
                    <TextField
                        label="Team"
                        name="teamId"
                        select
                        value={formData.teamId}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                    >
                        {teams.map((team) => (
                            <MenuItem key={team.id} value={team.id}>
                                {team.name}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 2 }}
                    >
                        Register
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}
