import { Container, Typography, Button } from "@mui/material";
import { logout } from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <Container>
            <Typography variant="h3" gutterBottom>
                Dashboard
            </Typography>
            <Button variant="contained" color="secondary" onClick={handleLogout}>
                Logout
            </Button>
        </Container>
    );
}
