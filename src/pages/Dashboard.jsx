import { Container, Typography, Button, Box, Paper } from "@mui/material";
import { logout } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const navigate = useNavigate();

    return (
        <Container maxWidth="md" sx={{ mt: 5 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
                <Typography variant="h4" gutterBottom>Welcome to the Dashboard</Typography>
                <Typography variant="body1" gutterBottom>
                    Manage your teams, tasks, and projects efficiently.
                </Typography>
                <Box mt={3}>
                    <Button variant="contained" color="primary" onClick={() => navigate("/kanban")} sx={{ mx: 1 }}>
                        Open Kanban Board
                    </Button>
                    <Button variant="contained" color="secondary" onClick={logout} sx={{ mx: 1 }}>
                        Logout
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}
