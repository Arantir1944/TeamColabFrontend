// src/pages/ChatPage.jsx
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Grid,
    Paper,
    Typography,
    Divider
} from "@mui/material";
import ConversationList from "../components/chat/ConversationList";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import CallButton from "../components/call/CallButton";
import {
    getConversations,
    getConversation,
    sendMessage
} from "../services/chatService";
import socket from "../utils/socket";
import { AuthContext } from "../contexts/AuthContext";

export default function ChatPage() {
    const [convos, setConvos] = useState([]);
    const [activeConvo, setActiveConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // 1) Load conversations, init unread, and join all rooms
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

    // 2) When you select a convo, clear its badge and load its messages
    const handleSelect = convo => {
        setUnreadCounts(u => ({ ...u, [convo.id]: 0 }));
        setActiveConvo(convo);
        getConversation(convo.id).then(c => setMessages(c.Messages));
    };

    // 3) Listen for ALL newMessage events once
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
        return () => { socket.off("newMessage", handler); };
    }, [activeConvo]);

    // 4) Incoming call prompt
    useEffect(() => {
        const incoming = ({ callId, initiatorId, initiatorName }) => {
            if (
                window.confirm(`${initiatorName} is calling you. Join?`)
            ) {
                navigate(`/call/${callId}`, { state: { initiatorId } });
            }
        };
        socket.on("incomingCall", incoming);
        return () => { socket.off("incomingCall", incoming); };
    }, [navigate]);

    const handleSend = content => {
        sendMessage({ conversationId: activeConvo.id, content })
            .then(msg => setMessages(m => [...m, msg]));
    };

    return (
        <Grid container sx={{ height: "100vh" }}>
            {/* Sidebar */}
            <Grid item xs={3}>
                <Paper square sx={{ height: "100%", overflow: "auto" }}>
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
