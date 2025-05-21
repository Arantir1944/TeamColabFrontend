import React, { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../services/authService";
import {
    Container,
    Typography,
    Paper,
    Box,
    CircularProgress,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Divider
} from "@mui/material";

export default function MyTeamPage() {
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        axios.get("https://16.170.210.30:5001/api/teams/user", {
            headers: { Authorization: getToken() }
        })
            .then(res => setTeam(res.data.team))
            .catch(() => setError("Could not load your team."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
            <CircularProgress />
        </Box>
    );

    if (error) return <Typography color="error" align="center">{error}</Typography>;

    if (!team) return <Typography align="center">You are not in a team yet.</Typography>;

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                    My Team
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                    <strong>Team ID:</strong> {team.id}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                    <strong>Team Name:</strong> {team.name}
                </Typography>

                {team.Users && team.Users.length > 0 && (
                    <Box mt={4}>
                        <Typography variant="h6" gutterBottom>
                            Members
                        </Typography>
                        <List>
                            {team.Users.map(user => (
                                <React.Fragment key={user.id}>
                                    <ListItem>
                                        <ListItemAvatar>
                                            <Avatar>
                                                {user.firstName[0]}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={`${user.firstName} ${user.lastName}`}
                                            secondary={user.email}
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                </React.Fragment>
                            ))}
                        </List>
                    </Box>
                )}
            </Paper>
        </Container>
    );
}
