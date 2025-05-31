// src/services/callService.js

import axios from "axios";
import { getToken } from "./authService";

const API_BASE = "https://16.170.210.30:5001/api/calls";

function authHeaders() {
    return { Authorization: getToken() };
}

/**
 * 1. initiateCall({ conversationId, type? }) →
 *      POST /api/calls
 *      Body: { conversationId, type }
 *    Response: { message, call, roomId }
 */
export const initiateCall = ({ conversationId, type = "video" }) =>
    axios
        .post(API_BASE, { conversationId, type }, { headers: authHeaders() })
        .then((res) => res.data);

/**
 * 2. joinCall(callId) →
 *      POST /api/calls/:callId/join
 *      Body: {} (empty)
 *    Response: { message, callId, roomId }
 */
export const joinCall = (callId) =>
    axios
        .post(`${API_BASE}/${callId}/join`, {}, { headers: authHeaders() })
        .then((res) => res.data);

/**
 * 3. leaveCall(callId) →
 *      POST /api/calls/:callId/leave
 *      Body: {} (empty)
 *    Response: { message }
 */
export const leaveCall = (callId) =>
    axios
        .post(`${API_BASE}/${callId}/leave`, {}, { headers: authHeaders() })
        .then((res) => res.data);

/**
 * 4. endCall(callId) →
 *      POST /api/calls/:callId/end
 *      Body: {} (empty)
 *    Response: { message }
 */
export const endCall = (callId) =>
    axios
        .post(`${API_BASE}/${callId}/end`, {}, { headers: authHeaders() })
        .then((res) => res.data);

/**
 * 5. getCallParticipants(callId) →
 *      GET /api/calls/:callId/participants
 *    Response: { participants: [ { id, firstName, lastName, email, joinTime } ] }
 */
export const getCallParticipants = (callId) =>
    axios
        .get(`${API_BASE}/${callId}/participants`, { headers: authHeaders() })
        .then((res) => res.data.participants);
