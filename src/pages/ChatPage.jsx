// src/pages/ChatPage.jsx

import React, { useEffect, useState, useContext } from "react";
import { Grid, Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ConversationList from "../components/chat/ConversationList";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import CallButton from "../components/call/CallButton";
import socket from "../utils/socket";
import { AuthContext } from "../contexts/AuthContext";

export default function ChatPage() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [activeConvo, setActiveConvo] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);

    // ─── 1. Load conversations on mount (example placeholder) ──────────────────────────────
    useEffect(() => {
        // TODO: replace with your real fetchConversations() API call
        // fetchConversations().then((convos) => setConversations(convos));
    }, []);

    // ─── 2. Listen for newMessage socket events ─────────────────────────────────────────────
    useEffect(() => {
        if (!activeConvo) return;
        const handleNewMessage = (msg) => {
            if (msg.conversationId === activeConvo.id) {
                setMessages((prev) => [...prev, msg]);
            }
        };
        socket.on("newMessage", handleNewMessage);
        return () => {
            socket.off("newMessage", handleNewMessage);
        };
    }, [activeConvo]);

    // ─── 3. Listen for incomingCall socket events ───────────────────────────────────────────
    useEffect(() => {
        const incoming = ({ callId, initiatorId, initiatorName }) => {
            if (
                window.confirm(`${initiatorName} is calling you. Would you like to join?`)
            ) {
                navigate(`/call/${callId}`, { state: { initiatorId } });
            }
        };
        socket.on("incomingCall", incoming);
        return () => {
            socket.off("incomingCall", incoming);
        };
    }, [navigate]);

    // ─── 4. When a user selects a conversation ──────────────────────────────────────────────
    const handleConvoSelect = (conversation) => {
        setActiveConvo(conversation);
        // TODO: fetch messages for that conversation:
        // fetchMessages(conversation.id).then((msgs) => setMessages(msgs));
    };

    return (
        <Grid container sx={{ height: "100vh" }}>
            <Grid item xs={3}>
                <ConversationList
                    conversations={conversations}
                    activeConvo={activeConvo}
                    onSelect={handleConvoSelect}
                />
            </Grid>
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
                                    activeConvo.Users.map((u) => u.firstName).join(", ")}
                            </Typography>
                            <CallButton conversationId={activeConvo.id} />
                        </Box>
                        <Box flexGrow={1} overflow="auto">
                            <MessageList messages={messages} />
                        </Box>
                        <Box>
                            <MessageInput conversationId={activeConvo.id} />
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
