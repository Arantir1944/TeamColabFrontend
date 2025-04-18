// src/components/chat/ConversationList.jsx
import React from "react";
export default function ConversationList({ convos, activeId, onSelect }) {
    return (
        <div style={{ width: 250, borderRight: "1px solid #ccc" }}>
            {convos.map(c => (
                <div
                    key={c.id}
                    onClick={() => onSelect(c)}
                    style={{
                        padding: "8px",
                        cursor: "pointer",
                        background: c.id === activeId ? "#eee" : "transparent"
                    }}
                >
                    {c.name || c.Users.map(u => u.firstName).join(", ")}
                </div>
            ))}
        </div>
    );
}
