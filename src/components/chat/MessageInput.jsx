// src/components/chat/MessageInput.jsx
import React, { useState } from "react";
import { TextField, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

export default function MessageInput({ onSend }) {
    const [text, setText] = useState("");
    const send = () => {
        if (!text.trim()) return;
        onSend(text.trim());
        setText("");
    };
    return (
        <div style={{ display: "flex", padding: 8 }}>
            <TextField
                fullWidth
                variant="outlined"
                size="small"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
            />
            <IconButton onClick={send}><SendIcon /></IconButton>
        </div>
    );
}
