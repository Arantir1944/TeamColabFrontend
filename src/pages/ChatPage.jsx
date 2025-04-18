// src/pages/ChatPage.jsx
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import ConversationList from "../components/chat/ConversationList";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import CallButton from "../components/call/CallButton";
import { getConversations, getConversation, sendMessage } from "../services/chatService";
import socket from "../utils/socket";
import { AuthContext } from "../contexts/AuthContext";

export default function ChatPage() {
    const [convos, setConvos] = useState([]);
    const [activeConvo, setActive] = useState(null);
    const [messages, setMessages] = useState([]);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Load conversations on mount
    useEffect(() => {
        getConversations().then(setConvos);
    }, []);

    // When active changes, fetch its messages & join its room
    useEffect(() => {
        if (activeConvo) {
            getConversation(activeConvo.id).then(c => setMessages(c.Messages));
            socket.emit("joinConversation", activeConvo.id);
        }
        return () => {
            if (activeConvo) socket.emit("leaveConversation", activeConvo.id);
        };
    }, [activeConvo]);

    // Listen for real‑time new messages
    useEffect(() => {
        const handler = msg => {
            if (msg.conversationId === activeConvo?.id) {
                setMessages(m => [...m, msg]);
            }
        };
        socket.on("newMessage", handler);
        return () => { socket.off("newMessage", handler); };
    }, [activeConvo]);

    // Listen for incoming calls
    useEffect(() => {
        const incoming = ({ callId, initiatorId, initiatorName }) => {
            const accept = window.confirm(`${initiatorName} is calling you. Join?`);
            if (accept) {
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
        <div style={{ display: "flex", height: "100vh" }}>
            <ConversationList
                convos={convos}
                activeId={activeConvo?.id}
                onSelect={setActive}
            />
            {activeConvo && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: 8, borderBottom: "1px solid #ccc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2 style={{ margin: 0 }}>
                            {activeConvo.name || activeConvo.Users.map(u => u.firstName).join(", ")}
                        </h2>
                        <CallButton conversationId={activeConvo.id} />
                    </div>
                    <MessageList messages={messages} />
                    <MessageInput onSend={handleSend} />
                </div>
            )}
        </div>
    );
}
