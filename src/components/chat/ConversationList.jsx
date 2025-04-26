// src/components/chat/ConversationList.jsx
import React from "react";
import {
    List,
    ListItemButton,
    ListItemText,
    Badge
} from "@mui/material";

export default function ConversationList({
    convos,
    activeId,
    onSelect,
    unreadCounts = {}
}) {
    return (
        <List>
            {convos.map(c => (
                <ListItemButton
                    key={c.id}
                    selected={c.id === activeId}
                    onClick={() => onSelect(c)}
                >
                    <Badge
                        badgeContent={unreadCounts[c.id]}
                        color="error"
                        invisible={!unreadCounts[c.id]}
                    >
                        <ListItemText
                            primary={c.name || c.Users.map(u => u.firstName).join(", ")}
                        />
                    </Badge>
                </ListItemButton>
            ))}
        </List>
    );
}
