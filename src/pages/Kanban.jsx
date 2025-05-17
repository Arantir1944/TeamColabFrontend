import { useEffect, useState } from "react";
import axios from "axios";
import {
    Container, Typography, Button, Paper, Box, Modal, TextField,
    MenuItem, Select, Alert, IconButton
} from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { getToken } from "../services/authService";
import DeleteIcon from "@mui/icons-material/Delete";

const initialColumns = {
    "todo": { name: "To Do", items: [] },
    "in-progress": { name: "In Progress", items: [] },
    "done": { name: "Done", items: [] },
};

export default function Kanban() {
    const [columns, setColumns] = useState(initialColumns);
    const [openTaskModal, setOpenTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: "", description: "" });
    const [boards, setBoards] = useState([]);
    const [selectedBoard, setSelectedBoard] = useState(null);
    const [newBoard, setNewBoard] = useState("");
    const [boardModalOpen, setBoardModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const getFormattedToken = () => {
        const token = getToken();
        return token ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`) : "";
    };

    useEffect(() => {
        const fetchBoards = async () => {
            try {
                const response = await axios.get("https://16.170.210.30:5001/api/boards", {
                    headers: { Authorization: getFormattedToken() },
                });
                setBoards(response.data.boards);
                if (response.data.boards.length > 0) {
                    setSelectedBoard(response.data.boards[0].id);
                    fetchTasks(response.data.boards[0].id);
                }
            } catch (error) {
                console.error("Error fetching boards:", error.response?.data || error.message);
            }
        };
        fetchBoards();
    }, []);

    // When fetching tasks, map statuses to match the allowed strings ("To Do", etc.)
    const fetchTasks = async (boardId) => {
        try {
            const response = await axios.get(`https://16.170.210.30:5001/api/tasks/${boardId}`, {
                headers: { Authorization: getFormattedToken() },
            });
            const tasks = response.data.tasks;
            const newColumns = {
                "todo": { name: "To Do", items: tasks.filter(task => task.status === "To Do") },
                "in-progress": { name: "In Progress", items: tasks.filter(task => task.status === "In Progress") },
                "done": { name: "Done", items: tasks.filter(task => task.status === "Done") },
            };
            setColumns(newColumns);
        } catch (error) {
            console.error("Error fetching tasks:", error.response?.data || error.message);
        }
    };

    const handleBoardChange = (event) => {
        setSelectedBoard(event.target.value);
        fetchTasks(event.target.value);
    };

    const handleCreateBoard = async () => {
        if (!newBoard.trim()) return;
        setErrorMessage("");
        try {
            const token = getToken();
            const decodedToken = JSON.parse(atob(token.split(".")[1]));
            const teamId = decodedToken.teamId;

            const response = await axios.post(
                "https://16.170.210.30:5001/api/boards/create",
                { name: newBoard, teamId },
                { headers: { Authorization: getFormattedToken() } }
            );

            setBoards(prevBoards => [...prevBoards, response.data.board]);
            setSelectedBoard(response.data.board.id);
            fetchTasks(response.data.board.id);
            setBoardModalOpen(false);
            setNewBoard("");
        } catch (error) {
            setErrorMessage(error.response?.data?.message || "Error creating board.");
            console.error("Error creating board:", error.response?.data || error.message);
        }
    };

    const handleDeleteBoard = async (boardId) => {
        try {
            await axios.delete(`https://16.170.210.30:5001/api/boards/${boardId}`, {
                headers: { Authorization: getFormattedToken() },
            });
            setBoards(boards.filter(board => board.id !== boardId));
            if (selectedBoard === boardId) {
                setSelectedBoard(boards.length > 1 ? boards[0].id : null);
            }
        } catch (error) {
            console.error("Error deleting board:", error.response?.data || error.message);
        }
    };

    // TASK FUNCTIONS

    const handleCreateTask = async () => {
        if (!newTask.title.trim() || !selectedBoard) return;
        try {
            const response = await axios.post(
                "https://16.170.210.30:5001/api/tasks/create",
                { ...newTask, boardId: selectedBoard, status: "To Do" },
                { headers: { Authorization: getFormattedToken() } }
            );
            const createdTask = response.data.task;
            // Add the new task to the "To Do" column
            setColumns(prev => ({
                ...prev,
                "todo": {
                    ...prev["todo"],
                    items: [...prev["todo"].items, createdTask]
                }
            }));
            setNewTask({ title: "", description: "" });
            setOpenTaskModal(false);
        } catch (error) {
            console.error("Error creating task:", error.response?.data || error.message);
        }
    };

    const handleDeleteTask = async (taskId, columnId) => {
        try {
            await axios.delete(`https://16.170.210.30:5001/api/tasks/delete/${taskId}`, {
                headers: { Authorization: getFormattedToken() },
            });
            setColumns(prev => ({
                ...prev,
                [columnId]: {
                    ...prev[columnId],
                    items: prev[columnId].items.filter(task => task.id !== taskId)
                }
            }));
        } catch (error) {
            console.error("Error deleting task:", error.response?.data || error.message);
        }
    };

    // When dragging tasks, map droppable IDs to allowed status strings.
    const onDragEnd = async (result) => {
        if (!result.destination) return;
        const { source, destination } = result;

        // If same column, just reorder tasks
        if (source.droppableId === destination.droppableId) {
            const column = columns[source.droppableId];
            const copiedItems = Array.from(column.items);
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
            const statusMapping = {
                "todo": "To Do",
                "in-progress": "In Progress",
                "done": "Done"
            };

            const newStatus = statusMapping[destination.droppableId];
            if (!newStatus) {
                console.error("Invalid status mapping");
                return;
            }
            const sourceColumn = columns[source.droppableId];
            const destColumn = columns[destination.droppableId];
            const sourceItems = Array.from(sourceColumn.items);
            const destItems = Array.from(destColumn.items);
            const [removed] = sourceItems.splice(source.index, 1);

            // Update removed task's status using mapped value
            removed.status = newStatus;
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
            // Persist the change to the backend
            try {
                await axios.put(
                    `https://16.170.210.30:5001/api/tasks/update/${removed.id}`,
                    { status: newStatus },
                    { headers: { Authorization: getFormattedToken() } }
                );
            } catch (error) {
                console.error("Error updating task status:", error.response?.data || error.message);
            }
        }
    };

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h3" gutterBottom>Kanban Board</Typography>
            <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                <Select value={selectedBoard || ""} onChange={handleBoardChange} displayEmpty>
                    <MenuItem value="" disabled>Select a Board</MenuItem>
                    {boards.map(board => (
                        <MenuItem key={board.id} value={board.id}>
                            {board.name}
                            <IconButton onClick={() => handleDeleteBoard(board.id)}>
                                <DeleteIcon color="error" />
                            </IconButton>
                        </MenuItem>
                    ))}
                </Select>
                <Box>
                    <Button variant="contained" color="primary" onClick={() => setOpenTaskModal(true)} sx={{ mr: 2 }}>
                        + New Task
                    </Button>
                    <Button variant="contained" color="primary" onClick={() => setBoardModalOpen(true)}>
                        + New Board
                    </Button>
                </Box>
            </Box>

            {/* TASK DRAG & DROP */}
            <DragDropContext onDragEnd={onDragEnd}>
                <Box display="flex" gap={2}>
                    {Object.entries(columns).map(([columnId, column]) => (
                        <Paper key={columnId} sx={{ flex: 1, p: 2 }}>
                            <Typography variant="h5" sx={{ mb: 1 }}>{column.name}</Typography>
                            <Droppable droppableId={columnId}>
                                {(provided, snapshot) => (
                                    <Box
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        minHeight={100}
                                        sx={{ background: snapshot.isDraggingOver ? "#f0f0f0" : "inherit", p: 1 }}
                                    >
                                        {column.items.map((task, index) => (
                                            <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                                                {(provided, snapshot) => (
                                                    <Paper
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        sx={{
                                                            p: 1, mb: 1,
                                                            background: snapshot.isDragging ? "#e0e0e0" : "white",
                                                            display: "flex", justifyContent: "space-between", alignItems: "center"
                                                        }}
                                                    >
                                                        <Box>
                                                            <Typography variant="subtitle1">{task.title}</Typography>
                                                            <Typography variant="body2">{task.description}</Typography>
                                                        </Box>
                                                        <IconButton onClick={() => handleDeleteTask(task.id, columnId)}>
                                                            <DeleteIcon color="error" />
                                                        </IconButton>
                                                    </Paper>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </Box>
                                )}
                            </Droppable>
                        </Paper>
                    ))}
                </Box>
            </DragDropContext>

            {/* New Board Modal */}
            <Modal open={boardModalOpen} onClose={() => setBoardModalOpen(false)}>
                <Box sx={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)", width: 400,
                    bgcolor: "white", p: 4, borderRadius: 2
                }}>
                    <Typography variant="h5">Create New Board</Typography>
                    {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
                    <TextField
                        fullWidth
                        label="Board Name"
                        value={newBoard}
                        onChange={(e) => setNewBoard(e.target.value)}
                        margin="normal"
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCreateBoard}
                        sx={{ mt: 2 }}
                        disabled={!newBoard.trim()}
                    >
                        Create
                    </Button>
                </Box>
            </Modal>

            {/* New Task Modal */}
            <Modal open={openTaskModal} onClose={() => setOpenTaskModal(false)}>
                <Box sx={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)", width: 400,
                    bgcolor: "white", p: 4, borderRadius: 2
                }}>
                    <Typography variant="h5">Create New Task</Typography>
                    <TextField
                        fullWidth
                        label="Task Title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        label="Task Description"
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        margin="normal"
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCreateTask}
                        sx={{ mt: 2 }}
                        disabled={!newTask.title.trim()}
                    >
                        Create Task
                    </Button>
                </Box>
            </Modal>
        </Container>
    );
}
