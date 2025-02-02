import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Typography, Box, Button, Modal, TextField, MenuItem } from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const API_URL = "http://localhost:5000/api/tasks";

export default function Kanban() {
    const [tasks, setTasks] = useState({
        "To Do": [],
        "In Progress": [],
        "Done": [],
    });

    const [open, setOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        status: "To Do",
    });

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await axios.get(`${API_URL}/1`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });

                const groupedTasks = {
                    "To Do": [],
                    "In Progress": [],
                    "Done": [],
                };

                response.data.tasks.forEach((task) => {
                    groupedTasks[task.status].push(task);
                });

                setTasks(groupedTasks);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };

        fetchTasks();
    }, []);

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const { source, destination } = result;
        const sourceColumn = source.droppableId;
        const destColumn = destination.droppableId;

        const movedTask = tasks[sourceColumn][source.index];
        movedTask.status = destColumn;

        try {
            await axios.put(`${API_URL}/update-status`, {
                taskId: movedTask.id,
                status: destColumn,
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            setTasks((prev) => {
                const updatedTasks = { ...prev };
                updatedTasks[sourceColumn].splice(source.index, 1);
                updatedTasks[destColumn].splice(destination.index, 0, movedTask);
                return updatedTasks;
            });
        } catch (error) {
            console.error("Error updating task status:", error);
        }
    };

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleInputChange = (e) => {
        setNewTask({ ...newTask, [e.target.name]: e.target.value });
    };

    const handleCreateTask = async () => {
        console.log("Creating task:", newTask); // Debugging log

        try {
            const response = await axios.post(`${API_URL}/create`, {
                title: newTask.title,
                description: newTask.description,
                boardId: 1, // Change this if needed
                assignedTo: null, // Change this if needed
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            console.log("Task created:", response.data); // Debugging log

            setTasks((prev) => ({
                ...prev,
                "To Do": [...prev["To Do"], response.data.task],
            }));

            setNewTask({ title: "", description: "", status: "To Do" });
            handleClose();
        } catch (error) {
            console.error("Error creating task:", error.response?.data || error.message);
        }
    };


    return (
        <Container>
            <Typography variant="h3" gutterBottom>
                Kanban Board
            </Typography>

            <Button variant="contained" color="primary" onClick={handleOpen} sx={{ mb: 2 }}>
                + New Task
            </Button>

            <Modal open={open} onClose={handleClose}>
                <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 400, bgcolor: "white", p: 4, borderRadius: 2 }}>
                    <Typography variant="h5">Create New Task</Typography>
                    <TextField fullWidth label="Title" name="title" value={newTask.title} onChange={handleInputChange} margin="normal" />
                    <TextField fullWidth label="Description" name="description" value={newTask.description} onChange={handleInputChange} margin="normal" />
                    <Button variant="contained" color="primary" onClick={handleCreateTask} sx={{ mt: 2 }}>Create</Button>
                </Box>
            </Modal>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Box display="flex" justifyContent="space-between">
                    {Object.keys(tasks).map((status) => (
                        <Droppable key={status} droppableId={status}>
                            {(provided) => (
                                <Box ref={provided.innerRef} {...provided.droppableProps} width="30%" p={2} bgcolor="lightgray" borderRadius={2}>
                                    <Typography variant="h5">{status}</Typography>
                                    {tasks[status].map((task, index) => (
                                        <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                            {(provided) => (
                                                <Box ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} p={1} bgcolor="white" m={1} borderRadius={1} boxShadow={2}>
                                                    {task.title}
                                                </Box>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </Box>
                            )}
                        </Droppable>
                    ))}
                </Box>
            </DragDropContext>
        </Container>
    );
}
