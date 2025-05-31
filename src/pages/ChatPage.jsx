// src/pages/ChatPage.jsx
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Grid,
    Paper,
    Typography,
    Divider,
    TextField,
    Autocomplete
} from "@mui/material";
import ConversationList from "../components/chat/ConversationList";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import CallButton from "../components/call/CallButton";
import {
    getConversations,
    getConversation,
    sendMessage,
    searchUsers,
    startDirectConversation
} from "../services/chatService";
import socket from "../utils/socket";
import { AuthContext } from "../contexts/AuthContext";

export default function ChatPage() {
    const [convos, setConvos] = useState([]);
    const [activeConvo, setActiveConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        getConversations().then(list => {
            setConvos(list);
            const counts = {};
            list.forEach(({ id }) => {
                counts[id] = 0;
                socket.emit("joinConversation", id);
            });
            setUnreadCounts(counts);
        });
    }, []);

    const handleSelect = convo => {
        setUnreadCounts(u => ({ ...u, [convo.id]: 0 }));
        setActiveConvo(convo);
        getConversation(convo.id).then(c => setMessages(c.Messages));
    };

    const handleSend = content => {
        sendMessage({ conversationId: activeConvo.id, content })
            .then(msg => setMessages(m => [...m, msg]));
    };

    const handleSearchChange = async (event, value) => {
        setSearchQuery(value);
        if (value.length >= 2) {
            const users = await searchUsers(value);
            setSearchResults(users);
        } else {
            setSearchResults([]);
        }
    };

    const handleUserSelect = async (event, selectedUser) => {
        if (!selectedUser) return;
        const convo = await startDirectConversation(selectedUser.id);
        setActiveConvo(convo);
        setConvos(c => [...c, convo]);
        getConversation(convo.id).then(c => setMessages(c.Messages));
    };

    useEffect(() => {
        const handler = msg => {
            if (msg.conversationId === activeConvo?.id) {
                setMessages(m => [...m, msg]);
            } else {
                setUnreadCounts(u => ({
                    ...u,
                    [msg.conversationId]: (u[msg.conversationId] || 0) + 1
                }));
            }
        };
        socket.on("newMessage", handler);
        return () => socket.off("newMessage", handler);
    }, [activeConvo]);

    useEffect(() => {
        const incoming = ({ callId, initiatorId, initiatorName }) => {
            if (window.confirm(`${initiatorName} is calling you. Join?`)) {
                navigate(`/call/${callId}`, { state: { initiatorId } });
            }
        };
        socket.on("incomingCall", incoming);
        return () => socket.off("incomingCall", incoming);
    }, [navigate]);

    return (
        <Grid container sx={{ height: "100vh" }}>
            {/* Sidebar */}
            <Grid item xs={3}>
                <Paper square sx={{ height: "100%", overflow: "auto" }}>
                    <Box p={2}>
                        <Autocomplete
                            options={searchResults}
                            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                            onInputChange={handleSearchChange}
                            onChange={handleUserSelect}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Start a chat..."
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                />
                            )}
                        />
                    </Box>
                    <ConversationList
                        convos={convos}
                        activeId={activeConvo?.id}
                        onSelect={handleSelect}
                        unreadCounts={unreadCounts}
                    />
                </Paper>
            </Grid>

            {/* Chat */}
            <Grid item xs={9}>
                {activeConvo ? (
                    <Box display="flex" flexDirection="column" height="100%">
                        <Box
                            display="flex"
                            alignItems="center"
                            p={2}
                            borderBottom={1}
                            borderColor="divider"
                        >
                            <Typography variant="h6" flexGrow={1}>
                                {activeConvo.name ||
                                    activeConvo.Users.map(u => u.firstName).join(", ")}
                            </Typography>
                            <CallButton conversationId={activeConvo.id} />
                        </Box>

                        <Box
                            component={Paper}
                            elevation={0}
                            square
                            sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}
                        >
                            <MessageList messages={messages} />
                        </Box>

                        <Divider />

                        <Box component={Paper} square sx={{ p: 2 }}>
                            <MessageInput onSend={handleSend} />
                        </Box>
                    </Box>
                ) : (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height="100%"
                    >
                        <Typography variant="h6" color="textSecondary">
                            Select a conversation to start chatting
                        </Typography>
                    </Box>
                )}
            </Grid>
        </Grid>
    );
}