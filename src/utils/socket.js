// src/utils/socket.js
import { io } from "socket.io-client";
import { getToken } from "../services/authService";  // :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}

const token = getToken()?.split(" ")[1]; // strip "Bearer "
export const socket = io("http://localhost:5000", {
    auth: { token }
});

socket.on("connect", () => {
    const payload = JSON.parse(atob(token.split(".")[1]));
    socket.emit("register", { userId: payload.id });
});

export default socket;
