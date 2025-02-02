import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Typography, Button, Paper, Box, Grid, Modal, TextField } from "@mui/material";
import { getToken } from "../services/authService";

export default function Kanban() {
    const [tasks, setTasks] = useState([]);
    const [open, setOpen] = useState(false);
    const [newTask, setNewTask] = useState({ title: "", description: "" });

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/tasks/1", {
                    headers: { Authorization: getToken() },  // ✅ NO 'Bearer '
                });

                setTasks(response.data.tasks);
            } catch (error) {
                console.error("Error fetching tasks:", error.response?.data || error.message);
            }
        };

        fetchTasks();
    }, []);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleInputChange = (e) => {
        setNewTask({ ...newTask, [e.target.name]: e.target.value });
    };

    const handleCreateTask = async () => {
        try {
            const response = await axios.post("http://localhost:5000/api/tasks/create", newTask, {
                headers: { Authorization: getToken() },  // ✅ NO 'Bearer '
            });

            setTasks([...tasks, response.data.task]);
            handleClose();
        } catch (error) {
            console.error("Error creating task:", error.response?.data || error.message);
        }
    };

    return (
        <Container>
            <Typography variant="h3" gutterBottom>Kanban Board</Typography>
            <Button variant="contained" color="primary" onClick={handleOpen} sx={{ mb: 2 }}>
                + New Task
            </Button>

            <Grid container spacing={2}>
                {tasks.map((task) => (
                    <Grid item xs={12} sm={6} md={4} key={task.id}>
                        <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="h6">{task.title}</Typography>
                            <Typography variant="body2" color="textSecondary">{task.description}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Modal open={open} onClose={handleClose}>
                <Box sx={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)", width: 400,
                    bgcolor: "white", p: 4, borderRadius: 2
                }}>
                    <Typography variant="h5">Create New Task</Typography>
                    <TextField fullWidth label="Title" name="title" value={newTask.title} onChange={handleInputChange} margin="normal" />
                    <TextField fullWidth label="Description" name="description" value={newTask.description} onChange={handleInputChange} margin="normal" />
                    <Button variant="contained" color="primary" onClick={handleCreateTask} sx={{ mt: 2 }}>Create</Button>
                </Box>
            </Modal>
        </Container>
    );
}
