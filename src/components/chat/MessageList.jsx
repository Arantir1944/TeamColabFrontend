// src/components/chat/MessageList.jsx
import React, { useRef, useEffect } from "react";
import {
    List,
    ListItem,
    ListItemText,
    Typography
} from "@mui/material";

export default function MessageList({ messages }) {
    const endRef = useRef();
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <List>
            {messages.map((m) => (
                <ListItem key={m.id} alignItems="flex-start">
                    <ListItemText
                        primary={
                            <Typography variant="subtitle2" component="span">
                                {m.sender.firstName}
                            </Typography>
                        }
                        secondary={m.content}
                    />
                </ListItem>
            ))}
            <div ref={endRef} />
        </List>
    );
}
