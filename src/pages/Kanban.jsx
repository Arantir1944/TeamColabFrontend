import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Typography, Button, Paper, Box, Modal, TextField } from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { getToken } from "../services/authService";

// Define initial empty columns for our Kanban board
const initialColumns = {
    "todo": {
        name: "To Do",
        items: [],
    },
    "in-progress": {
        name: "In Progress",
        items: [],
    },
    "done": {
        name: "Done",
        items: [],
    },
};

export default function Kanban() {
    const [columns, setColumns] = useState(initialColumns);
    const [open, setOpen] = useState(false);
    const [newTask, setNewTask] = useState({ title: "", description: "" });

    // Helper: ensure our token includes the "Bearer " prefix
    const getFormattedToken = () => {
        const token = getToken();
        return token ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`) : "";
    };

    // Fetch tasks from backend and distribute them into columns based on task.status
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/tasks/1", {
                    headers: { Authorization: getFormattedToken() },
                });
                // Assuming each task has a 'status' property: "todo", "in-progress", or "done"
                const tasks = response.data.tasks;
                const newColumns = {
                    "todo": { name: "To Do", items: tasks.filter(task => task.status === "todo") },
                    "in-progress": { name: "In Progress", items: tasks.filter(task => task.status === "in-progress") },
                    "done": { name: "Done", items: tasks.filter(task => task.status === "done") },
                };
                setColumns(newColumns);
            } catch (error) {
                console.error("Error fetching tasks:", error.response?.data || error.message);
            }
        };
        fetchTasks();
    }, []);

    // Handle drag-and-drop events
    const onDragEnd = async (result) => {
        if (!result.destination) return;
        const { source, destination } = result;

        if (source.droppableId === destination.droppableId) {
            // Reordering within the same column
            const column = columns[source.droppableId];
            const copiedItems = [...column.items];
            const [removed] = copiedItems.splice(source.index, 1);
            copiedItems.splice(destination.index, 0, removed);
            setColumns({
                ...columns,
                [source.droppableId]: {
                    ...column,
                    items: copiedItems,
                },
            });
        } else {
            // Moving task between columns; update task status accordingly
            const sourceColumn = columns[source.droppableId];
            const destColumn = columns[destination.droppableId];
            const sourceItems = [...sourceColumn.items];
            const destItems = [...destColumn.items];
            const [removed] = sourceItems.splice(source.index, 1);
            // Update task status to new column id
            removed.status = destination.droppableId;
            destItems.splice(destination.index, 0, removed);
            setColumns({
                ...columns,
                [source.droppableId]: {
                    ...sourceColumn,
                    items: sourceItems,
                },
                [destination.droppableId]: {
                    ...destColumn,
                    items: destItems,
                },
            });
            // Update task status in backend
            try {
                await axios.put(
                    `http://localhost:5000/api/tasks/${removed.id}`,
                    { status: destination.droppableId },
                    { headers: { Authorization: getFormattedToken() } }
                );
            } catch (error) {
                console.error("Error updating task status:", error.response?.data || error.message);
            }
        }
    };

    // Modal controls for creating a new task
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const handleInputChange = (e) => {
        setNewTask({ ...newTask, [e.target.name]: e.target.value });
    };

    const handleCreateTask = async () => {
        try {
            // Create task with default status "todo"
            const response = await axios.post(
                "http://localhost:5000/api/tasks/create",
                { title: newTask.title, description: newTask.description, boardId: 1, status: "todo" },
                { headers: { Authorization: getFormattedToken() } }
            );
            const createdTask = response.data.task;
            // Add the new task to the "To Do" column
            setColumns(prev => ({
                ...prev,
                "todo": {
                    ...prev["todo"],
                    items: [...prev["todo"].items, createdTask],
                },
            }));
            handleClose();
        } catch (error) {
            console.error("Error creating task:", error.response?.data || error.message);
        }
    };

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h3" gutterBottom>Kanban Board</Typography>
            <Button variant="contained" color="primary" onClick={handleOpen} sx={{ mb: 2 }}>
                + New Task
            </Button>
            <DragDropContext onDragEnd={onDragEnd}>
                <Box display="flex" justifyContent="space-between">
                    {Object.entries(columns).map(([columnId, column]) => (
                        <Box key={columnId} sx={{ width: "32%" }}>
                            <Typography variant="h5" align="center" sx={{ mb: 2 }}>{column.name}</Typography>
                            <Droppable droppableId={columnId}>
                                {(provided, snapshot) => (
                                    <Box
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        sx={{
                                            background: snapshot.isDraggingOver ? "#f4f4f4" : "#e2e2e2",
                                            padding: 2,
                                            minHeight: 500,
                                            borderRadius: 2,
                                        }}
                                    >
                                        {column.items.map((item, index) => (
                                            <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                                                {(provided, snapshot) => (
                                                    <Paper
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        sx={{
                                                            p: 2,
                                                            mb: 2,
                                                            background: snapshot.isDragging ? "#cfcfcf" : "white",
                                                        }}
                                                    >
                                                        <Typography variant="h6">{item.title}</Typography>
                                                        <Typography variant="body2">{item.description}</Typography>
                                                    </Paper>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </Box>
                                )}
                            </Droppable>
                        </Box>
                    ))}
                </Box>
            </DragDropContext>
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
