import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { getToken } from "../services/authService";
import { AuthContext } from "../contexts/AuthContext";
import {
    Container, Typography, Paper, Box, CircularProgress, List,
    ListItem, ListItemAvatar, Avatar, ListItemText, Divider, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, Button
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

export default function MyTeamPage() {
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", role: "" });

    const { user } = useContext(AuthContext);
    const isManagerOrTL = user?.role === "Manager" || user?.role === "Team Leader";

    useEffect(() => {
        axios.get("https://16.170.210.30:5001/api/teams/user", {
            headers: { Authorization: getToken() }
        })
            .then(res => setTeam(res.data.team))
            .catch(() => setError("Could not load your team."))
            .finally(() => setLoading(false));
    }, []);

    const openEditModal = (user) => {
        setSelectedUser(user);
        setForm({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role || ""
        });
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setSelectedUser(null);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`https://16.170.210.30:5001/api/users/${id}`, {
                headers: { Authorization: getToken() }
            });
            setTeam(prev => ({
                ...prev,
                Users: prev.Users.filter(u => u.id !== id)
            }));
        } catch (err) {
            alert("Failed to delete user.");
        }
    };

    const handleSave = async () => {
        try {
            await axios.put(`https://16.170.210.30:5001/api/users/${selectedUser.id}`, form, {
                headers: { Authorization: getToken() }
            });
            setTeam(prev => ({
                ...prev,
                Users: prev.Users.map(u =>
                    u.id === selectedUser.id ? { ...u, ...form } : u
                )
            }));
            closeEditModal();
        } catch (err) {
            alert("Failed to update user.");
        }
    };

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
                            {team.Users.map(member => (
                                <React.Fragment key={member.id}>
                                    <ListItem
                                        secondaryAction={
                                            isManagerOrTL && member.id !== user?.id && (
                                                <Box>
                                                    <IconButton onClick={() => openEditModal(member)}>
                                                        <Edit />
                                                    </IconButton>
                                                    <IconButton onClick={() => handleDelete(member.id)}>
                                                        <Delete />
                                                    </IconButton>
                                                </Box>
                                            )
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar>{member.firstName[0]}</Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={`${member.firstName} ${member.lastName}`}
                                            secondary={`${member.email} • ${member.role || "No role"}`}
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                </React.Fragment>
                            ))}
                        </List>
                    </Box>
                )}
            </Paper>

            <Dialog open={editModalOpen} onClose={closeEditModal}>
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent>
                    <TextField
                        label="First Name"
                        fullWidth
                        margin="dense"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                    <TextField
                        label="Last Name"
                        fullWidth
                        margin="dense"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                    <TextField
                        label="Email"
                        fullWidth
                        margin="dense"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <TextField
                        label="Role"
                        fullWidth
                        margin="dense"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeEditModal}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>Save</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
