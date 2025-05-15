// src/services/chatService.js
import axios from "axios";
import { getToken } from "./authService";  // :contentReference[oaicite:2]{index=2}&#8203;:contentReference[oaicite:3]{index=3}

const API = "/api/chat";

function authHeaders() {
    return { Authorization: getToken() };
}

export const getConversations = () =>
    axios.get(`${API}/conversations`, { headers: authHeaders() })
        .then(res => res.data.conversations);

export const getConversation = (id) =>
    axios.get(`${API}/conversations/${id}`, { headers: authHeaders() })
        .then(res => res.data.conversation);

export const sendMessage = ({ conversationId, content, type = "text", fileUrl = null }) =>
    axios.post(`${API}/messages`,
        { conversationId, content, type, fileUrl },
        { headers: authHeaders() }
    ).then(res => res.data.sentMessage);
