import React, { useState, useEffect } from "react";
import { Container, Typography, Button, Box, Paper } from "@mui/material";
import { logout, getUserFromToken } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const currentUser = getUserFromToken();
        setUser(currentUser);
    }, []);

    return (
        <Container maxWidth="md" sx={{ mt: 5 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
                <Typography variant="h4" gutterBottom>
                    Welcome to the Dashboard
                </Typography>
                {user && (
                    <Typography variant="h6" gutterBottom>
                        Logged in as:{" "}
                        {user.firstName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email}{" "}
                        - {user.role}
                    </Typography>
                )}
                <Typography variant="body1" gutterBottom>
                    Manage your teams, tasks, and projects efficiently.
                </Typography>
                <Box mt={3}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate("/kanban")}
                        sx={{ mx: 1 }}
                    >
                        Open Kanban Board
                    </Button>
                    {user && user.role === "Manager" && (
                        <Button
                            variant="contained"
                            color="success"
                            onClick={() => navigate("/register")}
                            sx={{ mx: 1 }}
                        >
                            Register New User
                        </Button>
                    )}
                </Box>
            </Paper>
        </Container>
    );
}
