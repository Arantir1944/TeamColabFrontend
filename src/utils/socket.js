// src/utils/socket.js

import { io } from "socket.io-client";
import { getToken } from "../services/authService";

const SOCKET_URL = "https://16.170.210.30:5001";

const socket = io(SOCKET_URL, {
    auth: {
        token: getToken(), // your JWT, e.g. "Bearer <token>"
    },
});

// Once connected, register this socket into the "user-<userId>" room
socket.on("connect", () => {
    const raw = localStorage.getItem("token");
    if (!raw) return;
    try {
        const payload = JSON.parse(atob(raw.split(".")[1]));
        socket.emit("register", { userId: payload.id });
    } catch (err) {
        console.error("Error decoding token for socket.register:", err);
    }
});

export default socket;
