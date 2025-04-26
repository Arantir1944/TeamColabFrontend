// src/components/chat/MessageInput.jsx
import React, { useState } from "react";
import {
    Box,
    TextField,
    IconButton
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

export default function MessageInput({ onSend }) {
    const [text, setText] = useState("");
    const send = () => {
        if (!text.trim()) return;
        onSend(text.trim());
        setText("");
    };

    return (
        <Box display="flex">
            <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <IconButton
                color="primary"
                onClick={send}
                sx={{ ml: 1 }}
                aria-label="send message"
            >
                <SendIcon />
            </IconButton>
        </Box>
    );
}
