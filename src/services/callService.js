// src/services/callService.js
import axios from "axios";
import { getToken } from "./authService";  // :contentReference[oaicite:4]{index=4}&#8203;:contentReference[oaicite:5]{index=5}

const API = "https://16.170.210.30:5001/api/calls";

function authHeaders() {
    return { Authorization: getToken() };
}

export const initiateCall = ({ conversationId, type = "video" }) =>
    axios.post(API,
        { conversationId, type },
        { headers: authHeaders() }
    ).then(res => res.data);

export const joinCall = (callId) =>
    axios.post(`${API}/${callId}/join`, {}, { headers: authHeaders() })
        .then(res => res.data);

export const leaveCall = (callId) =>
    axios.post(`${API}/${callId}/leave`, {}, { headers: authHeaders() })
        .then(res => res.data);

export const endCall = (callId) =>
    axios.post(`${API}/${callId}/end`, {}, { headers: authHeaders() })
        .then(res => res.data);

export const getCallParticipants = (callId) =>
    axios.get(`${API}/${callId}/participants`, { headers: authHeaders() })
        .then(res => res.data.participants);
